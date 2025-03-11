// Main renderer process file
const { ipcRenderer } = require('electron');
// Use the global marked variable from the CDN instead of requiring it
// const marked = require('marked');

// Import modules
const projectData = require('./modules/projectData');
const uiManager = require('./modules/uiManager');
const tabManager = require('./modules/tabManager');
const reviewManager = require('./modules/reviewManager');
const reportManager = require('./modules/reportManager');
const utils = require('./modules/utils');
const eventHandlers = require('./modules/events');

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing application');
  
  // Initialize UI
  uiManager.initializeUI();
  
  // Set up tabs
  tabManager.setupTabs();
  
  // Load projects
  await loadAndRenderProjects();
  
  // Set up event listeners
  eventHandlers.setupEventListeners();
  
  console.log('Application initialized');
});

/**
 * Load and render all projects
 */
async function loadAndRenderProjects() {
  console.log('Loading and rendering projects');
  
  try {
    // Load projects data
    const projects = await projectData.loadProjects();
    if (!projects) {
      console.error('Failed to load projects');
      uiManager.showNotification('Failed to load projects', 'error');
      return;
    }
    
    // Process projects for well-formulated status
    processProjectsForWellFormulated(projects);
    
    // Render projects by category
    renderProjectsByCategory(projects);
    
    console.log('Projects loaded and rendered successfully');
  } catch (error) {
    console.error('Error loading and rendering projects:', error);
    uiManager.showNotification('Error loading projects: ' + error.message, 'error');
  }
}

/**
 * Process projects to check if they are well-formulated
 * @param {Object} projects The projects to process
 */
function processProjectsForWellFormulated(projects) {
  if (!projects) return;
  
  // Process active projects
  if (projects.active && Array.isArray(projects.active)) {
    projects.active.forEach(project => {
      project.isWellFormulated = utils.isProjectWellFormulated(project);
    });
    
    // Log projects that need improvement
    const needImprovement = projects.active.filter(p => !p.isWellFormulated);
    console.log(`Found ${needImprovement.length} active projects that need improvement:`, 
      needImprovement.map(p => p.title));
  }
  
  // Process waiting projects
  if (projects.waiting && Array.isArray(projects.waiting)) {
    projects.waiting.forEach(project => {
      project.isWellFormulated = utils.isProjectWellFormulated(project);
    });
  }
  
  // Process someday projects
  if (projects.someday && Array.isArray(projects.someday)) {
    projects.someday.forEach(project => {
      project.isWellFormulated = utils.isProjectWellFormulated(project);
    });
  }
}

/**
 * Render projects by category
 * @param {Object} projects The projects to render
 */
function renderProjectsByCategory(projects) {
  if (!projects) return;
  
  // Get container elements - using the correct IDs from the HTML
  const activeContainer = document.getElementById('active-projects');
  const waitingContainer = document.getElementById('waiting-projects');
  const somedayContainer = document.getElementById('someday-projects');
  const archiveContainer = document.getElementById('archive-projects');
  
  // Update project counts
  updateProjectCounts(projects);
  
  // Render active projects
  if (projects.active && Array.isArray(projects.active) && activeContainer) {
    console.log(`Rendering ${projects.active.length} active projects`);
    uiManager.renderProjects(projects.active, activeContainer);
  } else {
    console.error('Active projects container not found or no active projects');
  }
  
  // Render waiting projects
  if (projects.waiting && Array.isArray(projects.waiting) && waitingContainer) {
    console.log(`Rendering ${projects.waiting.length} waiting projects`);
    uiManager.renderProjects(projects.waiting, waitingContainer);
  } else {
    console.error('Waiting projects container not found or no waiting projects');
  }
  
  // Render someday projects
  if (projects.someday && Array.isArray(projects.someday) && somedayContainer) {
    console.log(`Rendering ${projects.someday.length} someday projects`);
    uiManager.renderProjects(projects.someday, somedayContainer);
  } else {
    console.error('Someday projects container not found or no someday projects');
  }
  
  // Render archive projects
  if (projects.archive && Array.isArray(projects.archive) && archiveContainer) {
    console.log(`Rendering ${projects.archive.length} archive projects`);
    uiManager.renderProjects(projects.archive, archiveContainer);
  } else {
    console.error('Archive projects container not found or no archive projects');
  }
}

/**
 * Update project counts in the UI
 * @param {Object} projects The projects data
 */
function updateProjectCounts(projects) {
  // Update active count
  const activeCountElement = document.getElementById('active-count');
  if (activeCountElement && projects.active) {
    activeCountElement.textContent = projects.active.length;
  }
  
  // Update waiting count
  const waitingCountElement = document.getElementById('waiting-count');
  if (waitingCountElement && projects.waiting) {
    waitingCountElement.textContent = projects.waiting.length;
  }
  
  // Update someday count
  const somedayCountElement = document.getElementById('someday-count');
  if (somedayCountElement && projects.someday) {
    somedayCountElement.textContent = projects.someday.length;
  }
  
  // Update archive count
  const archiveCountElement = document.getElementById('archive-count');
  if (archiveCountElement && projects.archive) {
    archiveCountElement.textContent = projects.archive.length;
  }
}

// Export functions for testing and module interaction
module.exports = {
  loadAndRenderProjects,
  processProjectsForWellFormulated,
  renderProjectsByCategory,
  updateProjectCounts
};
