/**
 * Utility for parsing project content
 */
class ProjectParser {
  /**
   * Extract project name from filename
   * @param {string} filename - Project filename
   * @returns {string} - Extracted project name
   */
  extractProjectName(filename) {
    // Remove .txt extension and replace underscores with spaces
    return filename.replace(/\.txt$/i, '').replace(/_/g, ' ');
  }

  /**
   * Parse project content to extract structured data
   * @param {string} content - Project content
   * @returns {Object} - Structured project data
   */
  parseProjectContent(content) {
    const projectData = {
      title: null,
      endState: null,
      tasks: [],
      additionalInfo: null,
      waitingInput: null,
    };

    // Extract title (first heading)
    const titleMatch = content.match(/^\s*#\s+(.+)$/m);
    if (titleMatch) {
      projectData.title = titleMatch[1].trim();
    }

    // Extract end state
    const endStateMatch = content.match(
      /##\s+End\s+State\s*\n([\s\S]*?)(?=\n##|$)/i
    );
    if (endStateMatch) {
      projectData.endState = endStateMatch[1].trim();
    }

    // Extract tasks
    const tasksMatch = content.match(/##\s+Tasks\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (tasksMatch) {
      const tasksList = tasksMatch[1].trim();
      const taskRegex = /- \[([ xX])\]\s*(.+)$/gm;
      let match;

      while ((match = taskRegex.exec(tasksList)) !== null) {
        projectData.tasks.push({
          completed: match[1].toLowerCase() === 'x',
          description: match[2].trim(),
        });
      }
    }

    // Extract additional information
    const additionalInfoMatch = content.match(
      /##\s+Additional\s+Information\s*\n([\s\S]*?)(?=\n##|$)/i
    );
    if (additionalInfoMatch) {
      projectData.additionalInfo = additionalInfoMatch[1].trim();
    }

    // Extract waiting input information
    const waitingInputMatch = content.match(
      /##\s+Waiting\s+on\s+Inputs\s*\n([\s\S]*?)(?=\n##|$)/i
    );
    if (waitingInputMatch) {
      projectData.waitingInput = waitingInputMatch[1].trim();
    }

    return projectData;
  }

  /**
   * Extract completed tasks from content
   * @param {string} content - Project content
   * @returns {Array} - Array of completed tasks
   */
  extractCompletedTasks(content) {
    const completedTasks = [];

    // Look for markdown-style checked checkboxes
    const checkboxPatterns = [
      /- \[x\] (.*?)(?:\n|$)/gi, // - [x] Task
      /- \[X\] (.*?)(?:\n|$)/g, // - [X] Task
    ];

    for (const pattern of checkboxPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        completedTasks.push(match[1].trim());
      }
    }

    return completedTasks;
  }

  /**
   * Count total tasks in content
   * @param {string} content - Project content
   * @returns {number} - Total number of tasks
   */
  countTotalTasks(content) {
    // Count all checkbox items, both checked and unchecked
    const checkboxPattern = /- \[[xX ]]\s+.*?(?:\n|$)/gi;
    const matches = content.match(checkboxPattern) || [];
    return matches.length;
  }

  /**
   * Validate project structure
   * @param {string} content - Project content
   * @param {string} filename - Project filename
   * @returns {Object} - Validation results
   */
  validateProjectStructure(content, filename) {
    const issues = [];

    // Check for required sections
    const requiredSections = [
      { name: 'Title', pattern: /^\s*#\s+.+$/m },
      { name: 'End State', pattern: /##\s+End\s+State/i },
      { name: 'Tasks', pattern: /##\s+Tasks/i },
    ];

    for (const section of requiredSections) {
      if (!section.pattern.test(content)) {
        issues.push(`Missing ${section.name} section`);
      }
    }

    // Check for tasks
    const taskCount = this.countTotalTasks(content);
    if (taskCount === 0) {
      issues.push('No tasks defined');
    }

    // Check for empty sections
    const emptySections = [
      { name: 'End State', pattern: /##\s+End\s+State\s*\n\s*(?=##|$)/i },
      { name: 'Tasks', pattern: /##\s+Tasks\s*\n\s*(?=##|$)/i },
    ];

    for (const section of emptySections) {
      if (section.pattern.test(content)) {
        issues.push(`Empty ${section.name} section`);
      }
    }

    return {
      isWellFormulated: issues.length === 0,
      needsImprovement: issues.length > 0,
      issues,
    };
  }
}

module.exports = { ProjectParser };
