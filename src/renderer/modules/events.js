// Event handlers module
const tabManager = require('./tabManager');
const reviewManager = require('./reviewManager');
const projectData = require('./projectData');
const duplicateDetector = require('./duplicateDetector');
const workflowManager = require('./workflowManager');
const uiManager = require('./uiManager');
const reportManager = require('./reportManager');

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
  console.log('Setting up event listeners');
  
  // Set up tab event listeners
  setupTabEventListeners();
  
  // Set up review event listeners
  setupReviewEventListeners();
  
  // Set up project event listeners
  setupProjectEventListeners();
  
  // Set up duplicate detection event listeners
  setupDuplicateDetectionEventListeners();
  
  // Set up workflow event listeners
  setupWorkflowEventListeners();
  
  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
  
  console.log('Event listeners set up');
}

/**
 * Set up tab event listeners
 */
function setupTabEventListeners() {
  console.log('Setting up tab event listeners');
  
  // Get tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      tabManager.switchTab(tabName);
    });
  });
  
  console.log('Tab event listeners set up');
}

/**
 * Set up review event listeners
 */
function setupReviewEventListeners() {
  console.log('Setting up review event listeners');
  
  // Get start review button
  const startReviewBtn = document.getElementById('start-review-btn');
  if (startReviewBtn) {
    startReviewBtn.addEventListener('click', () => {
      console.log('Start review button clicked');
      reviewManager.startProjectReview();
    });
  }
  
  console.log('Review event listeners set up');
}

/**
 * Set up project event listeners
 */
function setupProjectEventListeners() {
  console.log('Setting up project event listeners');
  
  // Get refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      console.log('Refresh button clicked');
      await projectData.loadProjects();
    });
  }
  
  console.log('Project event listeners set up');
}

/**
 * Set up duplicate detection event listeners
 */
function setupDuplicateDetectionEventListeners() {
  console.log('Setting up duplicate detection event listeners');
  
  // Set up event listeners for duplicate detection buttons
  duplicateDetector.setupEventListeners();
  
  console.log('Duplicate detection event listeners set up');
}

/**
 * Set up workflow event listeners
 */
function setupWorkflowEventListeners() {
  console.log('Setting up workflow event listeners');
  
  // Get the Remove Duplicates button
  const removeDuplicatesBtn = document.getElementById('remove-duplicates-btn');
  if (removeDuplicatesBtn) {
    removeDuplicatesBtn.addEventListener('click', () => {
      console.log('Remove Duplicates button clicked');
      tabManager.switchTab('duplicate-detection');
      duplicateDetector.startDuplicateDetection();
    });
  } else {
    console.error('Remove Duplicates button not found');
  }
  
  // Get the Sort Projects button
  const sortProjectsBtn = document.getElementById('sort-projects-btn');
  if (sortProjectsBtn) {
    sortProjectsBtn.addEventListener('click', () => {
      console.log('Sort Projects button clicked');
      tabManager.switchTab('review');
      reviewManager.startProjectReview();
    });
  } else {
    console.error('Sort Projects button not found');
  }
  
  // Get the Formulate Projects button
  const formulateProjectsBtn = document.getElementById('formulate-projects-btn');
  if (formulateProjectsBtn) {
    formulateProjectsBtn.addEventListener('click', () => {
      console.log('Formulate Projects button clicked');
      tabManager.switchTab('well-formulation');
      workflowManager.getWellFormulationManager().startWellFormulationCheck();
    });
  } else {
    console.error('Formulate Projects button not found');
  }
  
  // Get the View Report button
  const viewReportBtn = document.getElementById('view-report-btn');
  if (viewReportBtn) {
    viewReportBtn.addEventListener('click', () => {
      console.log('View Report button clicked');
      tabManager.switchTab('report');
      reportManager.generateReport();
    });
  } else {
    console.error('View Report button not found');
  }
  
  console.log('Workflow event listeners set up');
}

/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  console.log('Setting up keyboard shortcuts');
  
  // Add keyboard event listener
  document.addEventListener('keydown', (event) => {
    // Only handle keyboard shortcuts when not in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Handle review mode keyboard shortcuts
    if (reviewManager.isReviewMode()) {
      reviewManager.handleReviewKeydown(event);
    }
  });
  
  console.log('Keyboard shortcuts set up');
}

// Export functions for use in other modules
module.exports = {
  setupEventListeners
};
