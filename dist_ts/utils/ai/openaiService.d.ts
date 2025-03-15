/**
 * Service for interacting with OpenAI API
 */
export class OpenAIService {
    openai: OpenAI;
    /**
     * Generate a chat completion using OpenAI API
     * @param {Object} options - Options for the chat completion
     * @param {string} options.model - The model to use (e.g., 'gpt-4o')
     * @param {Array} options.messages - The messages to send to the API
     * @param {number} options.temperature - The temperature for the response
     * @param {number} options.maxTokens - The maximum number of tokens to generate
     * @returns {Promise<Object>} - The API response
     */
    generateChatCompletion(options: {
        model: string;
        messages: any[];
        temperature: number;
        maxTokens: number;
    }): Promise<Object>;
}
import { OpenAI } from "openai";
