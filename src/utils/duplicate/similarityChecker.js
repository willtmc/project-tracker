/**
 * Utility for checking text similarity between projects
 */
class SimilarityChecker {
  constructor() {
    this.similarityThreshold = 0.55;
  }

  /**
   * Extract keywords from text
   * @param {string} text - Text to extract keywords from
   * @returns {Array<string>} - Array of keywords
   */
  extractKeywords(text) {
    // Remove common stop words and split by non-alphanumeric characters
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as'];
    
    // Convert to lowercase and split by non-alphanumeric characters
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Check basic text similarity between two projects
   * @param {Object} project1 - First project object
   * @param {Object} project2 - Second project object
   * @returns {boolean} - True if projects are similar, false otherwise
   */
  checkBasicTextSimilarity(project1, project2) {
    // Extract titles
    const title1 = (project1.title || '').toLowerCase();
    const title2 = (project2.title || '').toLowerCase();
    
    // Check for common keywords in titles
    const keywords1 = this.extractKeywords(title1);
    const keywords2 = this.extractKeywords(title2);
    
    // Find common keywords
    const commonKeywords = keywords1.filter(keyword => 
      keywords2.includes(keyword)
    );
    
    // Log for debugging
    console.log(`Title 1: "${title1}" - Keywords: [${keywords1.join(', ')}]`);
    console.log(`Title 2: "${title2}" - Keywords: [${keywords2.join(', ')}]`);
    console.log(`Common keywords: [${commonKeywords.join(', ')}]`);
    
    // If there are significant common keywords, consider them similar
    // Either multiple common keywords or one significant keyword
    const significantMatch = commonKeywords.length >= 2 || 
      (commonKeywords.length === 1 && commonKeywords[0].length > 5);
    
    return significantMatch;
  }

  /**
   * Create a summary of a project for comparison
   * @param {Object} project - Project object
   * @returns {string} - Project summary
   */
  createProjectSummary(project) {
    // Now only returning the title since we're focusing on title-only comparison
    return `Title: ${project.title || 'Untitled'}`;
  }
}

module.exports = { SimilarityChecker };
