const { OpenAI } = require('openai');

/**
 * Utility for detecting duplicate projects
 * This module consolidates functionality from multiple duplicate detector implementations:
 * - src/renderer/modules/duplicateDetector.js (UI handling)
 * - src/utils/duplicateDetector.js (Core OpenAI functionality)
 * - src/utils/duplicate/duplicateDetector.js (Advanced implementation with helper classes)
 */
class DuplicateDetector {
  constructor() {
    this.similarityThreshold = 0.55; // Threshold for considering projects as potential duplicates
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Find potential duplicate projects within active projects
   * @param {Array} activeProjects - Array of active project objects
   * @returns {Promise<Array>} - Array of duplicate groups, each containing similar projects
   */
  async findPotentialDuplicates(activeProjects) {
    console.log('Finding potential duplicates among active projects...');
    console.log(`Total active projects: ${activeProjects ? activeProjects.length : 0}`);

    if (!activeProjects || activeProjects.length < 2) {
      console.log('Not enough projects to find duplicates');
      return [];
    }

    try {
      console.log(
        'Finding potential duplicates among',
        activeProjects.length,
        'projects'
      );

      // Extract all project titles
      const projectTitles = activeProjects.map(
        project => project.title || 'Untitled'
      );
      console.log('Project titles sample:', projectTitles.slice(0, 5));

      // Use OpenAI to identify groups of similar titles
      console.log('Calling OpenAI API with model: gpt-4o');
      try {
        const response = await this.openai.chat.completions.create({
          model: 'chatgpt-4o-latest', // Using GPT-4o for improved duplicate detection
          messages: [
            {
              role: 'system',
              content:
                'You are a specialized assistant that identifies groups of potentially duplicate or related project titles. ' +
                'Your task is to analyze a list of project titles and identify groups that might be related to the same initiative, goal, or outcome. ' +
                "Be VERY liberal in your grouping - it's much better to flag potential duplicates that aren't actually duplicates than to miss actual duplicates. " +
                "Pay special attention to projects from the same organization or domain (like 'Forge Flightworks', 'Avionics', etc.). " +
                'Consider the following as signs of potential duplication:\n' +
                "1. Similar keywords or themes (e.g., 'website redesign' and 'update website')\n" +
                "2. Same domain, organization, or area (e.g., 'Forge Flightworks dashboard' and 'FF dashboard update')\n" +
                "3. Similar goals or outcomes (e.g., 'increase sales' and 'boost revenue')\n" +
                '4. Projects that could be merged into a single larger project\n' +
                '5. Projects where one might be a subtask of another\n' +
                '6. Projects with similar prefixes or naming patterns\n' +
                '7. Projects that mention the same product, service, or component\n\n' +
                'Output ONLY a JSON array where each element is an array of indices representing a group of related titles. ' +
                'For example: [[0, 5, 9], [2, 7], [3, 11, 12]] means titles at indices 0, 5, and 9 are related; ' +
                'titles at indices 2 and 7 are related; and titles at indices 3, 11, and 12 are related. ' +
                'IMPORTANT: Only include groups with at least 2 related titles. If no related titles are found, return an empty array []. ' +
                'NEVER create a group with only a single index. Every group must contain at least 2 indices. ' +
                'Do not include any explanation, only the JSON array.',
            },
            {
              role: 'user',
              content: `Please identify groups of related project titles from the following list:\n\n${projectTitles.map((title, index) => `${index}: ${title}`).join('\n')}`,
            },
          ],
        });

        console.log('Received response from OpenAI API');

        // Parse the response to get groups of related titles
        let duplicateGroups = [];
        try {
          console.log(
            'Parsing OpenAI response:',
            response.choices[0].message.content
          );

          // Clean the response by removing markdown code block formatting if present
          let contentToParse = response.choices[0].message.content;

          // Remove markdown code block formatting if present
          if (contentToParse.includes('```json')) {
            contentToParse = contentToParse
              .replace(/```json/g, '')
              .replace(/```/g, '');
          } else if (contentToParse.includes('```')) {
            contentToParse = contentToParse.replace(/```/g, '');
          }

          // Trim any whitespace
          contentToParse = contentToParse.trim();

          console.log('Cleaned content for parsing:', contentToParse);
          const parsedGroups = JSON.parse(contentToParse);
          console.log('Successfully parsed JSON response:', parsedGroups);

          // Convert indices to actual projects
          if (Array.isArray(parsedGroups)) {
            duplicateGroups = parsedGroups.map(group => {
              return group
                .map(index => {
                  if (index >= 0 && index < activeProjects.length) {
                    return activeProjects[index];
                  } else {
                    console.error(
                      `Invalid index ${index} in duplicate group, max index is ${activeProjects.length - 1}`
                    );
                    return null;
                  }
                })
                .filter(Boolean); // Remove any null entries
            });
            console.log(
              `Created ${duplicateGroups.length} duplicate groups with projects:`
            );
            duplicateGroups.forEach((group, i) => {
              console.log(
                `Group ${i + 1}:`,
                group.map(p => p.title)
              );
            });
          }
        } catch (error) {
          console.error('Error parsing duplicate groups:', error);
          console.error(
            'Raw response content:',
            response.choices[0].message.content
          );
        }

        // Filter out any groups with only one project (this should not happen, but just in case)
        duplicateGroups = duplicateGroups.filter(group => group.length >= 2);

        console.log(
          `Found ${duplicateGroups.length} potential duplicate groups`
        );
        duplicateGroups.forEach((group, i) => {
          console.log(`Group ${i + 1}:`);
          group.forEach(project => console.log(`- ${project.title}`));
        });

        return duplicateGroups;
      } catch (openAIError) {
        console.error('Error calling OpenAI API:', openAIError);
        // Fall back to basic similarity check
        console.log('Falling back to basic similarity check');
        return this.findDuplicatesWithBasicSimilarity(activeProjects);
      }
    } catch (error) {
      console.error('Error finding potential duplicates with AI:', error);
      return [];
    }
  }

  /**
   * Find duplicates using basic text similarity (fallback method)
   * @param {Array} projects - Array of project objects
   * @returns {Array} - Array of duplicate groups
   */
  findDuplicatesWithBasicSimilarity(projects) {
    try {
      console.log('Using basic similarity check to find duplicates');
      const duplicateGroups = [];
      const processedIndices = new Set();

      for (let i = 0; i < projects.length; i++) {
        if (processedIndices.has(i)) continue;

        const currentProject = projects[i];
        const similarProjects = [currentProject];

        for (let j = i + 1; j < projects.length; j++) {
          if (processedIndices.has(j)) continue;

          const otherProject = projects[j];
          const isSimilar = this.checkBasicTextSimilarity(
            currentProject,
            otherProject
          );

          if (isSimilar) {
            similarProjects.push(otherProject);
            processedIndices.add(j);
          }
        }

        if (similarProjects.length > 1) {
          duplicateGroups.push(similarProjects);
          processedIndices.add(i);
        }
      }

      console.log(
        `Found ${duplicateGroups.length} potential duplicate groups using basic similarity`
      );
      return duplicateGroups;
    } catch (error) {
      console.error('Error in basic similarity check:', error);
      return [];
    }
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
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o for improved merging
        messages: [
          {
            role: 'system',
            content:
              'You are a specialized assistant that identifies duplicate or related projects based solely on their titles. ' +
              'Your task is to determine if two project titles refer to the same topic, initiative, or area of work. ' +
              "Projects with titles about the same topic (like 'avionics' or 'marketing campaign') should be identified as related " +
              "even if they have slightly different wording. Return ONLY 'true' if they appear to be related to the same topic, or 'false' if they are clearly different projects.",
          },
          {
            role: 'user',
            content: `Are these two project titles related to the same topic or initiative?\n\nTitle 1: ${title1}\n\nTitle 2: ${title2}`,
          },
        ],
        temperature: 0.1, // Low temperature for more deterministic results
        max_tokens: 10,
      });

      const result = response.choices[0].message.content.toLowerCase().trim();
      return result.includes('true');
    } catch (error) {
      console.error('Error checking project similarity with AI:', error);

      // Fallback to basic text similarity if AI fails
      return this.checkBasicTextSimilarity(project1, project2);
    }
  }

  /**
   * Basic text similarity check as fallback
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
    const significantMatch =
      commonKeywords.length >= 2 ||
      (commonKeywords.length === 1 && commonKeywords[0].length > 5);

    return significantMatch;
  }

  /**
   * Extract meaningful keywords from text
   * @param {string} text - Text to extract keywords from
   * @returns {Array} - Array of keywords
   */
  extractKeywords(text) {
    // Common stop words to filter out
    const stopWords = [
      'a', 
      'an', 
      'the', 
      'and', 
      'or', 
      'but', 
      'in', 
      'on', 
      'at', 
      'to', 
      'for',
      'with', 
      'by', 
      'about', 
      'as', 
      'of', 
      'from', 
      'this', 
      'that', 
      'these',
      'those', 
      'is', 
      'are', 
      'was', 
      'were', 
      'be', 
      'been', 
      'being', 
      'have',
      'has', 
      'had', 
      'do', 
      'does', 
      'did', 
      'will', 
      'would', 
      'should', 
      'could',
      'can', 
      'may', 
      'might', 
      'must', 
      'shall', 
      'should',
    ];

    // Split text into words, convert to lowercase
    const words = text.toLowerCase().split(/\W+/);

    // Filter out stop words, short words, and numbers
    const keywords = words.filter(
      word =>
        word.length > 2 &&
        !stopWords.includes(word.toLowerCase()) &&
        isNaN(word) // Filter out numbers
    );

    return keywords;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score between 0 and 1
   */
  calculateStringSimilarity(str1, str2) {
    if (!str1 && !str2) return 1; // Both empty strings are identical
    if (!str1 || !str2) return 0; // One empty string means no similarity

    // Use Levenshtein distance for similarity
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    // Convert distance to similarity score (1 - normalized distance)
    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;

    // Create distance matrix
    const dp = Array(m + 1)
      .fill()
      .map(() => Array(n + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return dp[m][n];
  }

  /**
   * Merge duplicate projects
   * @param {Array} projects - Array of projects to merge
   * @returns {Promise<Object>} - Merged project
   */
  async mergeProjects(projects) {
    if (!projects || projects.length < 2) {
      throw new Error('At least two projects are required for merging');
    }

    console.log(`Merging ${projects.length} projects...`);

    // Sort projects by last modified date (newest first)
    const sortedProjects = [...projects].sort(
      (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
    );

    // Use the newest project as the base
    const baseProject = sortedProjects[0];
    const mergedProject = { ...baseProject };

    // Combine content from all projects
    const mergedContent = await this.combineProjectContents(sortedProjects);
    mergedProject.content = mergedContent;

    console.log('Projects merged successfully');
    return mergedProject;
  }

  /**
   * Combine content from multiple projects using AI
   * @param {Array} projects - Array of projects to combine
   * @returns {Promise<string>} - Combined content
   */
  async combineProjectContents(projects) {
    try {
      // Create summaries of all projects
      const projectSummaries = projects
        .map(
          (project, index) =>
            `Project ${index + 1} (${project.title || 'Untitled'}):\n${project.content}`
        )
        .join('\n\n');

      // Use OpenAI to merge content
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o for improved merging
        messages: [
          {
            role: 'system',
            content:
              'You are a specialized assistant that combines multiple similar project documents into a single cohesive document. ' +
              'Your task is to create a comprehensive merged project that preserves all important information from the source projects. ' +
              'Follow these guidelines:\n' +
              '1. Create a clear, descriptive title that encompasses all related projects\n' +
              '2. Merge all unique tasks into a single task list, removing duplicates\n' +
              "3. Combine all relevant information from 'End State' sections\n" +
              '4. Preserve all dates, contacts, and specific details\n' +
              '5. Maintain the Markdown format with proper sections\n' +
              '6. The merged document should have: # Title, ## End State, ## Tasks, ## Additional Information, and other relevant sections\n' +
              '7. If projects have conflicting information, include both versions with appropriate context',
          },
          {
            role: 'user',
            content: `Please merge these similar projects into a single comprehensive project document, ensuring no information is lost:\n\n${projectSummaries}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error combining project contents with AI:', error);

      // Fallback to basic content combination
      return this.basicCombineContents(projects);
    }
  }

  /**
   * Basic method to combine project contents without AI
   * @param {Array} projects - Array of projects to combine
   * @returns {string} - Combined content
   */
  basicCombineContents(projects) {
    // Use the newest project as the base
    const baseProject = projects[0];

    // Extract sections from all projects
    const allSections = {};

    for (const project of projects) {
      const sections = this.extractSections(project.content);

      // Merge sections
      for (const [sectionName, content] of Object.entries(sections)) {
        if (!allSections[sectionName]) {
          allSections[sectionName] = content;
        } else {
          allSections[sectionName] += '\n' + content;
        }
      }
    }

    // Reconstruct the document
    let result = '';

    // Title should come first
    if (allSections['Title']) {
      result += allSections['Title'] + '\n\n';
      delete allSections['Title'];
    }

    // Add remaining sections
    for (const [sectionName, content] of Object.entries(allSections)) {
      if (sectionName !== 'Other') {
        result += `## ${sectionName}\n${content}\n\n`;
      }
    }

    // Add any uncategorized content
    if (allSections['Other']) {
      result += allSections['Other'];
    }

    return result;
  }

  /**
   * Extract sections from project content
   * @param {string} content - Project content
   * @returns {Object} - Object with section names as keys and content as values
   */
  extractSections(content) {
    if (!content) return { Other: '' };

    const sections = {};
    const lines = content.split('\n');

    let currentSection = 'Other';
    let currentContent = '';

    // Extract title (first line with # prefix)
    const titleLine = lines.find(line => line.trim().startsWith('# '));
    if (titleLine) {
      sections['Title'] = titleLine;
    }

    // Extract other sections
    for (const line of lines) {
      if (line.trim().startsWith('## ')) {
        // Save previous section
        if (currentContent) {
          sections[currentSection] = currentContent.trim();
        }

        // Start new section
        currentSection = line.trim().replace('## ', '');
        currentContent = '';
      } else if (line.trim().startsWith('# ') && !sections['Title']) {
        // This is the title
        sections['Title'] = line.trim();
      } else {
        // Add to current section
        currentContent += line + '\n';
      }
    }

    // Save the last section
    if (currentContent) {
      sections[currentSection] = currentContent.trim();
    }

    return sections;
  }

  /**
   * Generate a merged project from two similar projects
   * @param {Object} project1 - First project object
   * @param {Object} project2 - Second project object
   * @returns {Promise<Object>} - Merged project content
   */
  async generateMergedProject(project1, project2) {
    try {
      const title1 = project1.title || 'Untitled';
      const title2 = project2.title || 'Untitled';
      const content1 = project1.content || '';
      const content2 = project2.content || '';

      // Use OpenAI to merge the projects
      const response = await this.openai.chat.completions.create({
        model: 'chatgpt-4o-latest',
        messages: [
          {
            role: 'system',
            content:
              'You are a specialized assistant that merges two similar projects into a single, comprehensive project. ' +
              'Your task is to combine the information from both projects, removing duplicates and organizing the content logically. ' +
              'The merged project should follow this structure:\n' +
              '# [Merged Title]\n' +
              '## End State\n' +
              '[Combined end state that captures the goals of both projects]\n' +
              '## Tasks\n' +
              '[Combined task list with checkboxes, preserving completion status]\n' +
              '## Additional Information\n' +
              '[Combined additional information from both projects]\n' +
              '## Waiting on Inputs\n' +
              '[Combined waiting inputs, if any]\n\n' +
              'Ensure that:\n' +
              '1. The merged title captures the essence of both projects\n' +
              '2. All unique tasks from both projects are included\n' +
              '3. Task completion status is preserved (checked tasks remain checked)\n' +
              '4. All relevant information is retained\n' +
              '5. The merged project is well-structured and coherent',
          },
          {
            role: 'user',
            content: `Please merge these two similar projects into a single, comprehensive project:\n\nProject 1 (${title1}):\n\n${content1}\n\nProject 2 (${title2}):\n\n${content2}`,
          },
        ],
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating merged project:', error);
      throw error;
    }
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

// Export the DuplicateDetector class
module.exports = { DuplicateDetector };
