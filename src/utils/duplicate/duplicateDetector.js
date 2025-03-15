const { SimilarityChecker } = require('./similarityChecker');
const { AISimilarityChecker } = require('./aiSimilarityChecker');
const { OpenAIService } = require('../ai/openaiService');

/**
 * Utility for detecting duplicate projects
 */
class DuplicateDetector {
  constructor() {
    this.similarityChecker = new SimilarityChecker();
    this.aiSimilarityChecker = new AISimilarityChecker();
    this.openAIService = new OpenAIService();
  }

  /**
   * Find potential duplicate projects within active projects
   * @param {Array} activeProjects - Array of active project objects
   * @returns {Promise<Array>} - Array of duplicate groups, each containing similar projects
   */
  async findPotentialDuplicates(activeProjects) {
    console.log('Finding potential duplicates among active projects...');
    console.log(
      `Total active projects: ${activeProjects ? activeProjects.length : 0}`
    );

    if (!activeProjects || activeProjects.length < 2) {
      console.log('Not enough projects to find duplicates');
      return [];
    }

    // Check if the OpenAI service is properly initialized
    if (!this.openAIService) {
      console.error('ERROR: OpenAI service is not initialized');
    } else {
      console.log('OpenAI service is initialized');
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

      // Check if OpenAI service is available
      if (!this.openAIService) {
        console.error('OpenAI service is not available');
        return this.findDuplicatesWithBasicSimilarity(activeProjects);
      }

      // Use OpenAI to identify groups of similar titles
      console.log('Calling OpenAI API with model: gpt-4o');
      try {
        const response = await this.openAIService.generateChatCompletion({
          model: 'chatgpt-4o-latest',
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
          const isSimilar = this.similarityChecker.checkBasicTextSimilarity(
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
   * Check if two projects are similar
   * @param {Object} project1 - First project object
   * @param {Object} project2 - Second project object
   * @returns {Promise<boolean>} - True if projects are similar, false otherwise
   */
  async checkProjectSimilarity(project1, project2) {
    try {
      // First try AI-based similarity check
      return await this.aiSimilarityChecker.checkProjectSimilarityWithAI(
        project1,
        project2
      );
    } catch (error) {
      console.error(
        'AI similarity check failed, falling back to basic similarity check:',
        error
      );
      // Fallback to basic text similarity if AI fails
      return this.similarityChecker.checkBasicTextSimilarity(
        project1,
        project2
      );
    }
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
      const response = await this.openAIService.generateChatCompletion({
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
}

module.exports = { DuplicateDetector };
