"use strict";
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
    const content = project.content;
    // Check for required sections
    const hasEndState = content.includes('## End State') || content.includes('# End State');
    const hasTasks = content.includes('## Tasks') || content.includes('# Tasks');
    // Check if the title starts with an action verb
    const titleHasAction = checkTitleHasAction(project.title);
    // A well-formulated project should have an end state, tasks, and an action-oriented title
    return hasEndState && hasTasks && titleHasAction;
}
/**
 * Check if a project title starts with an action verb
 * @param {string} title The project title to check
 * @returns {boolean} Whether the title starts with an action verb
 */
function checkTitleHasAction(title) {
    if (!title)
        return false;
    // Common action verbs that should be at the beginning of project titles
    const actionVerbs = [
        'create',
        'develop',
        'implement',
        'build',
        'design',
        'establish',
        'set up',
        'organize',
        'plan',
        'prepare',
        'arrange',
        'coordinate',
        'execute',
        'complete',
        'finish',
        'deliver',
        'resolve',
        'fix',
        'repair',
        'update',
        'upgrade',
        'improve',
        'enhance',
        'optimize',
        'streamline',
        'simplify',
        'automate',
        'integrate',
        'connect',
        'link',
        'join',
        'merge',
        'combine',
        'consolidate',
        'unify',
        'research',
        'investigate',
        'explore',
        'analyze',
        'assess',
        'evaluate',
        'review',
        'examine',
        'study',
        'learn',
        'understand',
        'determine',
        'decide',
        'choose',
        'select',
        'identify',
        'find',
        'locate',
        'discover',
        'contact',
        'call',
        'email',
        'write',
        'send',
        'submit',
        'apply',
        'get',
        'obtain',
        'acquire',
        'secure',
        'purchase',
        'buy',
        'order',
        'schedule',
        'book',
        'reserve',
        'arrange',
        'set up',
        'coordinate',
        'meet',
        'discuss',
        'talk',
        'consult',
        'confer',
        'negotiate',
        'present',
        'demonstrate',
        'show',
        'display',
        'exhibit',
        'showcase',
        'train',
        'teach',
        'instruct',
        'educate',
        'coach',
        'mentor',
        'test',
        'verify',
        'validate',
        'check',
        'confirm',
        'ensure',
        'monitor',
        'track',
        'follow',
        'observe',
        'watch',
        'oversee',
        'manage',
        'supervise',
        'direct',
        'lead',
        'guide',
        'control',
    ];
    // Check if the title starts with any of the action verbs
    const titleLower = title.toLowerCase();
    return actionVerbs.some(verb => titleLower.startsWith(verb));
}
/**
 * Format date for display
 * @param {Date|string} date The date to format
 * @returns {string} The formatted date string
 */
function formatDate(date) {
    if (!date)
        return '';
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
    if (!html)
        return '';
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
    generateId,
    checkTitleHasAction,
};
//# sourceMappingURL=utils.js.map