const { OpenAI } = require('openai');

/**
 * Service for interacting with OpenAI API
 */
class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a chat completion using OpenAI API
   * @param {Object} options - Options for the chat completion
   * @param {string} options.model - The model to use (e.g., 'gpt-4o')
   * @param {Array} options.messages - The messages to send to the API
   * @param {number} options.temperature - The temperature for the response
   * @param {number} options.maxTokens - The maximum number of tokens to generate
   * @returns {Promise<Object>} - The API response
   */
  async generateChatCompletion(options) {
    try {
      const { model, messages, temperature = 0.7, maxTokens } = options;

      const requestOptions = {
        model,
        messages,
        temperature,
      };

      if (maxTokens) {
        requestOptions.max_tokens = maxTokens;
      }

      return await this.openai.chat.completions.create(requestOptions);
    } catch (error) {
      console.error('Error generating chat completion:', error);
      throw error;
    }
  }
}

module.exports = { OpenAIService };
