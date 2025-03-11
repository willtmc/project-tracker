// Utility functions module

/**
 * Check if a project is well-formulated
 * @param {Object} project The project to check
 * @returns {boolean} Whether the project is well-formulated
 */
function isProjectWellFormulated(project) {
  if (!project || !project.content) {
    return false;
  }
  
  const content = project.content.toLowerCase();
  
  // Check for outcome-based language
  const hasOutcome = content.includes('outcome:') || 
                    content.includes('goal:') || 
                    content.includes('result:') || 
                    content.includes('objective:');
  
  // Check for next action
  const hasNextAction = content.includes('next action:') || 
                       content.includes('next step:') || 
                       content.includes('next:');
  
  // Check for context
  const hasContext = content.includes('context:') || 
                    content.includes('where:') || 
                    content.includes('when:');
  
  // A well-formulated project should have at least an outcome and a next action
  return hasOutcome && hasNextAction;
}

/**
 * Format date for display
 * @param {Date|string} date The date to format
 * @returns {string} The formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString();
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func The function to debounce
 * @param {number} wait The wait time in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Escape HTML to prevent XSS
 * @param {string} html The HTML string to escape
 * @returns {string} The escaped HTML string
 */
function escapeHtml(html) {
  if (!html) return '';
  
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate a unique ID
 * @returns {string} A unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

module.exports = {
  isProjectWellFormulated,
  formatDate,
  debounce,
  escapeHtml,
  generateId
};
