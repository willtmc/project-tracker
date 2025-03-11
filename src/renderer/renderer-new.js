// Main renderer process
const { ipcRenderer } = require('electron');
const projectData = require('./modules/projectData');
const tabManager = require('./modules/tabManager');
const uiManager = require('./modules/uiManager');
const reviewManager = require('./modules/reviewManager');
const duplicateDetector = require('./modules/duplicateDetector');
const workflowManager = require('./modules/workflowManager');
const wellFormulationManager = require('./modules/wellFormulationManager');
const events = require('./modules/events');
const utils = require('./modules/utils');

/**
 * Initialize the application
 */
async function initialize() {
  console.log('Initializing renderer process');
  
  // Initialize UI components
  uiManager.initializeUI();
  
  // Initialize tab manager
  tabManager.setupTabs();
  
  // Initialize review manager
  reviewManager.initializeReviewElements();
  
  // Initialize well-formulation manager
  wellFormulationManager.initializeWellFormulationElements();
  
  // Initialize workflow manager
  workflowManager.initialize();
  
  // Set up event listeners
  events.setupEventListeners();
  wellFormulationManager.setupWellFormulationEventListeners();
  setupWorkflowEventListeners();
  
  // Load and render projects
  await loadAndRenderProjects();
  
  // Register IPC handlers
  registerIPCHandlers();
  
  console.log('Renderer process initialized');
}

/**
 * Load and render projects
 */
async function loadAndRenderProjects() {
  console.log('Loading and rendering projects');
  
  try {
    // Load projects data
    const projects = await projectData.loadProjects();
    
    // Process projects for well-formulated status
    processProjectsForWellFormulated(projects);
    
    // Render projects by category
    renderProjectsByCategory(projects);
    
    console.log('Projects loaded and rendered');
  } catch (error) {
    console.error('Error loading and rendering projects:', error);
    uiManager.showNotification('Error loading projects: ' + error.message, 'error');
  }
}

/**
 * Process projects for well-formulated status
 * @param {Object} projects The projects object with categories
 */
function processProjectsForWellFormulated(projects) {
  console.log('Processing projects for well-formulated status');
  
  if (!projects) return;
  
  // Process each category
  Object.keys(projects).forEach(category => {
    if (Array.isArray(projects[category])) {
      projects[category].forEach(project => {
        // Check if the project is well-formulated
        project.isWellFormulated = utils.isProjectWellFormulated(project);
      });
    }
  });
}

/**
 * Render projects by category
 * @param {Object} projects The projects object with categories
 */
function renderProjectsByCategory(projects) {
  console.log('Rendering projects by category');
  
  if (!projects) return;
  
  // Get project containers
  const activeContainer = document.getElementById('active-projects');
  const waitingContainer = document.getElementById('waiting-projects');
  const somedayContainer = document.getElementById('someday-projects');
  const archiveContainer = document.getElementById('archive-projects');
  
  // Clear containers
  if (activeContainer) activeContainer.innerHTML = '';
  if (waitingContainer) waitingContainer.innerHTML = '';
  if (somedayContainer) somedayContainer.innerHTML = '';
  if (archiveContainer) archiveContainer.innerHTML = '';
  
  // Render active projects
  if (projects.active && activeContainer) {
    renderProjectList(projects.active, activeContainer, 'active');
  }
  
  // Render waiting projects
  if (projects.waiting && waitingContainer) {
    renderProjectList(projects.waiting, waitingContainer, 'waiting');
  }
  
  // Render someday projects
  if (projects.someday && somedayContainer) {
    renderProjectList(projects.someday, somedayContainer, 'someday');
  }
  
  // Render archive projects
  if (projects.archive && archiveContainer) {
    renderProjectList(projects.archive, archiveContainer, 'archive');
  }
}

/**
 * Render a list of projects
 * @param {Array} projects The list of projects to render
 * @param {HTMLElement} container The container to render projects in
 * @param {string} category The category of projects
 */
function renderProjectList(projects, container, category) {
  if (!projects || !container) return;
  
  projects.forEach(project => {
    const projectElement = createProjectElement(project, category);
    container.appendChild(projectElement);
  });
}

/**
 * Create a project element
 * @param {Object} project The project to create an element for
 * @param {string} category The category of the project
 * @returns {HTMLElement} The project element
 */
function createProjectElement(project, category) {
  const projectElement = document.createElement('div');
  projectElement.className = `project-item ${project.isWellFormulated ? 'well-formulated' : 'needs-improvement'}`;
  projectElement.dataset.id = project.id;
  projectElement.dataset.path = project.path;
  projectElement.dataset.category = category;
  
  const titleElement = document.createElement('h3');
  titleElement.className = 'project-title';
  titleElement.textContent = project.title || 'Untitled Project';
  
  const lastModifiedElement = document.createElement('div');
  lastModifiedElement.className = 'project-last-modified';
  lastModifiedElement.textContent = `Last modified: ${utils.formatDate(project.lastModified)}`;
  
  projectElement.appendChild(titleElement);
  projectElement.appendChild(lastModifiedElement);
  
  return projectElement;
}

/**
 * Set up workflow-related event listeners
 */
function setupWorkflowEventListeners() {
  console.log('Setting up workflow event listeners');
  
  // Complete Review button
  const completeReviewBtn = document.getElementById('complete-review-btn');
  if (completeReviewBtn) {
    completeReviewBtn.addEventListener('click', () => {
      console.log('Complete Review button clicked');
      reviewManager.endReview();
    });
  }
  
  // Complete Well-Formulation button
  const completeWellFormulationBtn = document.getElementById('complete-well-formulation-btn');
  if (completeWellFormulationBtn) {
    completeWellFormulationBtn.addEventListener('click', () => {
      console.log('Complete Well-Formulation button clicked');
      wellFormulationManager.completeWellFormulationCheck();
    });
  }
}

/**
 * Register IPC handlers
 */
function registerIPCHandlers() {
  console.log('Registering IPC handlers');
  
  // Handle projects-updated event
  ipcRenderer.on('projects-updated', async () => {
    console.log('Received projects-updated event');
    await loadAndRenderProjects();
  });
  
  // Handle project-saved event
  ipcRenderer.on('project-saved', async (event, projectId) => {
    console.log('Received project-saved event for project:', projectId);
    await loadAndRenderProjects();
  });
  
  // Handle custom events
  document.addEventListener('projects-updated', async (event) => {
    console.log('Received custom projects-updated event');
    if (event.detail) {
      // Process and render the provided projects
      processProjectsForWellFormulated(event.detail);
      renderProjectsByCategory(event.detail);
    } else {
      // Reload projects if no detail provided
      await loadAndRenderProjects();
    }
  });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);

// Export functions for use in other modules
module.exports = {
  initialize,
  loadAndRenderProjects,
  processProjectsForWellFormulated,
  renderProjectsByCategory
};
