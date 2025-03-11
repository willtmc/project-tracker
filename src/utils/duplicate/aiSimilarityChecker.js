const { OpenAIService } = require('../ai/openaiService');

/**
 * Utility for checking project similarity using AI
 */
class AISimilarityChecker {
  constructor() {
    this.openAIService = new OpenAIService();
  }

  /**
   * Check if two projects are similar using OpenAI
   * @param {Object} project1 - First project object
   * @param {Object} project2 - Second project object
   * @returns {Promise<boolean>} - True if projects are similar, false otherwise
   */
  async checkProjectSimilarityWithAI(project1, project2) {
    try {
      // Extract just the titles for comparison
      const title1 = project1.title || 'Untitled';
      const title2 = project2.title || 'Untitled';
      
      // Use OpenAI to determine similarity based on titles only
      const response = await this.openAIService.generateChatCompletion({
        model: "gpt-4o", // Using GPT-4o for improved merging
        messages: [
          {
            role: "system",
            content: "You are a specialized assistant that identifies duplicate or related projects based solely on their titles. " +
                     "Your task is to determine if two project titles refer to the same topic, initiative, or area of work. " +
                     "Projects with titles about the same topic (like 'avionics' or 'marketing campaign') should be identified as related " +
                     "even if they have slightly different wording. Return ONLY 'true' if they appear to be related to the same topic, or 'false' if they are clearly different projects."
          },
          {
            role: "user",
            content: `Are these two project titles related to the same topic or initiative?\n\nTitle 1: ${title1}\n\nTitle 2: ${title2}`
          }
        ],
        temperature: 0.1, // Low temperature for more deterministic results
        maxTokens: 10
      });
      
      const result = response.choices[0].message.content.toLowerCase().trim();
      return result.includes('true');
    } catch (error) {
      console.error('Error checking project similarity with AI:', error);
      throw error;
    }
  }
}

module.exports = { AISimilarityChecker };
