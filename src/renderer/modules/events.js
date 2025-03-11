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
  
  // Get report button
  const reportBtn = document.getElementById('report-btn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      console.log('Report button clicked');
      tabManager.switchTab('report');
      reportManager.generateReport();
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
  
  // Get the Start Work button
  const startWorkBtn = document.getElementById('start-work-btn');
  if (startWorkBtn) {
    startWorkBtn.addEventListener('click', () => {
      console.log('Start Work button clicked');
      
      // Check if a workflow is already in progress
      if (workflowManager.isWorkflowInProgress()) {
        uiManager.showNotification('A workflow is already in progress', 'warning');
        return;
      }
      
      // Start the workflow
      workflowManager.startWorkflow();
    });
  } else {
    console.error('Start Work button not found');
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
