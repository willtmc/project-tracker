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

  // Set up project event listeners
  setupProjectEventListeners();

  // Set up workflow event listeners
  setupWorkflowEventListeners();

  // Set up duplicate detection event listeners
  setupDuplicateDetectionEventListeners();

  // Set up tab event listeners
  tabManager.setupTabEventListeners();

  // Set up modal event listeners
  setupModalEventListeners();

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

  // Get the Start Duplicate Detection button
  const startDuplicateDetectionBtn = document.getElementById(
    'start-duplicate-detection-btn'
  );
  if (startDuplicateDetectionBtn) {
    startDuplicateDetectionBtn.addEventListener('click', () => {
      console.log('Start Duplicate Detection button clicked');
      // Call the duplicate detection function
      duplicateDetector.handleDuplicateDetection();
    });
  } else {
    console.error('Start Duplicate Detection button not found');
  }

  console.log('Duplicate detection event listeners set up');
}

/**
 * Set up workflow event listeners
 */
function setupWorkflowEventListeners() {
  console.log('Setting up workflow event listeners');

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
  const formulateProjectsBtn = document.getElementById(
    'formulate-projects-btn'
  );
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
  document.addEventListener('keydown', event => {
    // Only handle keyboard shortcuts when not in an input field
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA'
    ) {
      return;
    }

    // Handle review mode keyboard shortcuts
    if (reviewManager.isReviewMode()) {
      reviewManager.handleReviewKeydown(event);
    }
  });

  console.log('Keyboard shortcuts set up');
}

/**
 * Set up modal event listeners
 */
function setupModalEventListeners() {
  console.log('Setting up modal event listeners');

  // Get all modal close buttons
  const closeButtons = document.querySelectorAll('.close');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Find the parent modal
      const modal = button.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Close modals when clicking outside
  window.addEventListener('click', event => {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });

  console.log('Modal event listeners set up');
}

// Export functions for use in other modules
module.exports = {
  setupEventListeners,
};
