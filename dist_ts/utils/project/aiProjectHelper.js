"use strict";
const { OpenAIService } = require('../ai/openaiService');
/**
 * Utility for AI-assisted project management
 */
class AIProjectHelper {
    constructor() {
        this.openAIService = new OpenAIService();
    }
    /**
     * Reformulate a project with AI assistance
     * @param {Object} project - Project object
     * @param {string} endState - New end state
     * @returns {Promise<string>} - Reformulated project content
     */
    async reformulateProject(project, endState) {
        try {
            const title = project.title || 'Untitled';
            const content = project.content || '';
            // Use OpenAI to reformulate the project
            const response = await this.openAIService.generateChatCompletion({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a specialized assistant that helps reformulate projects to make them more actionable and well-structured. ' +
                            'Your task is to take a project and its content, along with a new end state, and create a well-structured project with: ' +
                            "1. A clear title (use the original if it's good)\n" +
                            '2. A well-defined end state based on the provided new end state\n' +
                            '3. A comprehensive list of tasks needed to achieve the end state\n' +
                            '4. Any additional information from the original project\n' +
                            '5. Any waiting inputs from the original project\n\n' +
                            'The reformulated project should follow this structure:\n' +
                            '# [Title]\n' +
                            '## End State\n' +
                            '[End state description]\n' +
                            '## Tasks\n' +
                            '- [ ] Task 1\n' +
                            '- [ ] Task 2\n' +
                            '...\n' +
                            '## Additional Information\n' +
                            '[Additional information]\n' +
                            '## Waiting on Inputs\n' +
                            '[Waiting inputs, if any]\n\n' +
                            'Ensure that:\n' +
                            '1. The title is clear and descriptive\n' +
                            '2. The end state is specific, measurable, and achievable\n' +
                            '3. Tasks are concrete, actionable items\n' +
                            '4. All relevant information from the original project is preserved\n' +
                            '5. The reformulated project is well-structured and coherent',
                    },
                    {
                        role: 'user',
                        content: `Please reformulate this project with a new end state:\n\nProject Title: ${title}\n\nCurrent Content:\n${content}\n\nNew End State:\n${endState}`,
                    },
                ],
            });
            return response.choices[0].message.content;
        }
        catch (error) {
            console.error('Error reformulating project with AI:', error);
            throw error;
        }
    }
    /**
     * Generate a project report with AI assistance
     * @param {Object} projects - Projects object with active, waiting, someday, and archive arrays
     * @returns {Promise<string>} - Generated report
     */
    async generateReport(projects) {
        try {
            // Prepare project summaries for each category
            const projectSummaries = {
                active: this.prepareProjectSummaries(projects.active),
                waiting: this.prepareProjectSummaries(projects.waiting),
                someday: this.prepareProjectSummaries(projects.someday),
                archive: this.prepareProjectSummaries(projects.archive, 5), // Limit archived projects to 5 most recent
            };
            // Use OpenAI to generate the report
            const response = await this.openAIService.generateChatCompletion({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a specialized assistant that generates insightful project reports. ' +
                            'Your task is to analyze the provided project data and create a comprehensive report that includes: ' +
                            '1. An executive summary of the overall project status\n' +
                            '2. Key metrics (total projects, completion rates, etc.)\n' +
                            '3. Analysis of active projects (progress, priorities, bottlenecks)\n' +
                            "4. Analysis of waiting projects (what's blocking progress)\n" +
                            '5. Recommendations for next steps and focus areas\n\n' +
                            'The report should be well-structured, insightful, and actionable. ' +
                            'Focus on identifying patterns, highlighting priorities, and providing strategic recommendations.',
                    },
                    {
                        role: 'user',
                        content: `Please generate a project report based on the following data:\n\n` +
                            `Active Projects (${projects.active.length}):\n${projectSummaries.active}\n\n` +
                            `Waiting Projects (${projects.waiting.length}):\n${projectSummaries.waiting}\n\n` +
                            `Someday Projects (${projects.someday.length}):\n${projectSummaries.someday}\n\n` +
                            `Recently Archived Projects (${projectSummaries.archive ? 'up to 5 most recent' : '0'}):\n${projectSummaries.archive}`,
                    },
                ],
            });
            return response.choices[0].message.content;
        }
        catch (error) {
            console.error('Error generating report with AI:', error);
            throw error;
        }
    }
    /**
     * Prepare project summaries for report generation
     * @param {Array} projects - Array of project objects
     * @param {number} limit - Optional limit on number of projects to include
     * @returns {string} - Formatted project summaries
     */
    prepareProjectSummaries(projects, limit = null) {
        if (!projects || projects.length === 0) {
            return 'None';
        }
        // Sort projects by last modified date (most recent first)
        const sortedProjects = [...projects].sort((a, b) => {
            return new Date(b.lastModified) - new Date(a.lastModified);
        });
        // Apply limit if specified
        const projectsToInclude = limit
            ? sortedProjects.slice(0, limit)
            : sortedProjects;
        // Format project summaries
        return projectsToInclude
            .map(project => {
            const completionStatus = project.totalTasks > 0
                ? `${project.completedTasks}/${project.totalTasks} tasks (${Math.round(project.completionPercentage)}%)`
                : 'No tasks';
            return `- ${project.title || 'Untitled'}: ${completionStatus}`;
        })
            .join('\n');
    }
}
module.exports = { AIProjectHelper };
//# sourceMappingURL=aiProjectHelper.js.map