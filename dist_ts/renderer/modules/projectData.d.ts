/**
 * Load projects from all directories
 * @returns {Promise<Object>} The projects data
 */
export function loadProjects(): Promise<Object>;
/**
 * Get the stored projects data
 * @returns {Object} The projects data
 */
export function getProjectsData(): Object;
/**
 * Set the current project being edited
 * @param {Object} project The project to set as current
 */
export function setCurrentProject(project: Object): void;
/**
 * Get the current project being edited
 * @returns {Object} The current project
 */
export function getCurrentProject(): Object;
/**
 * Update a project's status
 * @param {Object} project The project to update
 * @param {string} targetStatus The target status (active, waiting, someday, archive)
 * @param {string} waitingInput Optional waiting input for waiting status
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export function updateProjectStatus(project: Object, targetStatus: string, waitingInput?: string): Promise<boolean>;
/**
 * Save project changes
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export function saveProjectChanges(): Promise<boolean>;
/**
 * Find potential duplicate projects
 * @returns {Promise<Array>} Array of duplicate groups
 */
export function findPotentialDuplicates(): Promise<any[]>;
/**
 * Merge duplicate projects
 * @param {Array} projectPaths Array of project paths to merge
 * @returns {Promise<Object>} Result of the merge operation
 */
export function mergeDuplicateProjects(projectPaths: any[]): Promise<Object>;
/**
 * Merge selected projects
 * @param {Array} projectPaths Array of project paths to merge
 * @returns {Promise<Object>} Result of the merge operation
 */
export function mergeProjects(projectPaths: any[]): Promise<Object>;
/**
 * Get projects with potential duplicates
 * @returns {Promise<Array>} Array of projects with potential duplicates
 */
export function getProjectsWithDuplicates(): Promise<any[]>;
/**
 * Update a project with new data
 * @param {Object} project The project data to update
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export function updateProject(project: Object): Promise<boolean>;
