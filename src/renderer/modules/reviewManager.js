// Review manager module
const projectData = require('./projectData');
const uiManager = require('./uiManager');

// Review state variables
let isInReviewMode = false;
let currentReviewIndex = 0;
let reviewProjects = [];

// Review UI elements
let reviewContainer;
let reviewProjectTitle;
let reviewProjectContent;
let reviewInstructions;
let waitingInputDialog;
let waitingInputText;
let waitingInputSaveBtn;
let waitingInputCancelBtn;

/**
 * Initialize review elements
 */
function initializeReviewElements() {
  console.log('Initializing review elements');
  
  // Get review container and elements
  reviewContainer = document.querySelector('.review-container');
  reviewProjectTitle = document.getElementById('review-project-title');
  reviewProjectContent = document.getElementById('review-project-content');
  reviewInstructions = document.querySelector('.review-instructions');
  
  // Get waiting input dialog elements
  waitingInputDialog = document.getElementById('waiting-dialog');
  waitingInputText = document.getElementById('waiting-input-text');
  waitingInputSaveBtn = document.getElementById('waiting-submit-btn');
  waitingInputCancelBtn = document.getElementById('waiting-cancel-btn');
  
  // Log review elements for debugging
  const reviewElements = {
    container: !!reviewContainer,
    title: !!reviewProjectTitle,
    content: !!reviewProjectContent,
    instructions: !!reviewInstructions,
    waitingDialog: !!waitingInputDialog,
    waitingText: !!waitingInputText,
    waitingSaveBtn: !!waitingInputSaveBtn,
    waitingCancelBtn: !!waitingInputCancelBtn
  };
  console.log('Review elements after initialization:', reviewElements);
}

/**
 * Start the project review process
 */
function startProjectReview() {
  console.log('Starting project review');
  
  // Check if review elements are initialized
  if (!reviewContainer || !reviewProjectTitle || !reviewProjectContent || !reviewInstructions) {
    console.error('Review elements not initialized');
    uiManager.showNotification('Error: Review elements not initialized', 'error');
    return;
  }
  
  // Get projects data
  const projectsData = projectData.getProjectsData();
  
  // Check if projects data is available
  if (!projectsData || !projectsData.active || projectsData.active.length === 0) {
    console.error('No active projects available for review');
    uiManager.showNotification('No active projects available for review', 'error');
    return;
  }
  
  // Set review mode
  isInReviewMode = true;
  
  // Set review projects to active projects
  reviewProjects = [...projectsData.active];
  
  // Reset review index
  currentReviewIndex = 0;
  
  // Show review container
  reviewContainer.style.display = 'block';
  
  // Show review instructions
  reviewInstructions.innerHTML = `
    <h3>Review Instructions</h3>
    <p>Use the following keyboard shortcuts to review projects:</p>
    <ul>
      <li><strong>Y</strong> - Keep project active</li>
      <li><strong>A</strong> - Archive project</li>
      <li><strong>S</strong> - Move to Someday</li>
      <li><strong>W</strong> - Move to Waiting (will prompt for input)</li>
      <li><strong>ESC</strong> - Cancel review</li>
    </ul>
  `;
  
  // Initialize review counter
  const reviewCount = document.getElementById('review-count');
  const reviewTotal = document.getElementById('review-total');
  
  if (reviewCount) {
    reviewCount.textContent = '0';
  }
  
  if (reviewTotal) {
    reviewTotal.textContent = reviewProjects.length.toString();
  }
  
  // Display first project
  displayCurrentProject();
  
  console.log('Project review started');
}

/**
 * Display the current project being reviewed
 */
function displayCurrentProject() {
  if (!isInReviewMode || !reviewProjects || reviewProjects.length === 0) {
    console.error('Cannot display project: not in review mode or no projects');
    return;
  }
  
  // Check if we've reached the end of the projects
  if (currentReviewIndex >= reviewProjects.length) {
    console.log('Reached end of projects to review');
    endReview();
    return;
  }
  
  // Get current project
  const currentProject = reviewProjects[currentReviewIndex];
  
  // Display project title and content
  reviewProjectTitle.textContent = currentProject.title || 'Untitled Project';
  
  // Use marked to render markdown content if available
  if (window.marked && currentProject.content) {
    reviewProjectContent.innerHTML = window.marked.parse(currentProject.content);
  } else {
    reviewProjectContent.textContent = currentProject.content || 'No content';
  }
  
  // Update review progress
  const reviewCount = document.getElementById('review-count');
  const reviewTotal = document.getElementById('review-total');
  
  if (reviewCount) {
    reviewCount.textContent = currentReviewIndex.toString();
  }
  
  if (reviewTotal) {
    reviewTotal.textContent = reviewProjects.length.toString();
  }
  
  console.log(`Displaying project ${currentReviewIndex + 1}/${reviewProjects.length}: ${currentProject.title}`);
}

/**
 * Move to the next project in the review
 */
function moveToNextProject() {
  if (!isInReviewMode) {
    console.error('Cannot move to next project: not in review mode');
    return;
  }
  
  // Update review counter
  const reviewCount = document.getElementById('review-count');
  if (reviewCount) {
    // Increment the displayed count (current index + 1 because we're moving to the next)
    reviewCount.textContent = (currentReviewIndex + 1).toString();
  }
  
  // Increment review index
  currentReviewIndex++;
  
  // Display next project or end review if done
  if (currentReviewIndex < reviewProjects.length) {
    displayCurrentProject();
  } else {
    endReview();
  }
}

/**
 * End the review process
 */
function endReview() {
  console.log('Ending review');
  
  // Reset review mode
  isInReviewMode = false;
  
  // Hide review container
  if (reviewContainer) {
    reviewContainer.style.display = 'none';
  }
  
  // Show notification
  uiManager.showNotification('Review completed', 'success');
  
  // Reload projects to reflect any changes
  const renderer = require('../renderer-new');
  renderer.loadAndRenderProjects();
}

/**
 * Cancel the review process
 */
function cancelReview() {
  console.log('Canceling review');
  
  // Reset review mode
  isInReviewMode = false;
  
  // Hide review container
  if (reviewContainer) {
    reviewContainer.style.display = 'none';
  }
  
  // Show notification
  uiManager.showNotification('Review canceled', 'info');
}

/**
 * Show the waiting input dialog for a project
 * @param {Object} project The project to move to waiting
 */
function showWaitingInputDialog(project) {
  console.log('Showing waiting input dialog');
  
  if (!waitingInputDialog || !waitingInputText) {
    console.error('Waiting input dialog elements not found');
    uiManager.showNotification('Error: Could not show waiting input dialog', 'error');
    return;
  }
  
  // Clear previous input
  waitingInputText.value = '';
  
  // Show the dialog
  waitingInputDialog.style.display = 'block';
  
  // Focus on the input field
  waitingInputText.focus();
  
  // Set up save button event
  if (waitingInputSaveBtn) {
    // Remove any existing event listeners
    const newSaveBtn = waitingInputSaveBtn.cloneNode(true);
    waitingInputSaveBtn.parentNode.replaceChild(newSaveBtn, waitingInputSaveBtn);
    waitingInputSaveBtn = newSaveBtn;
    
    // Add new event listener
    waitingInputSaveBtn.addEventListener('click', () => {
      saveWaitingInput(project);
    });
  }
  
  // Set up cancel button event
  if (waitingInputCancelBtn) {
    // Remove any existing event listeners
    const newCancelBtn = waitingInputCancelBtn.cloneNode(true);
    waitingInputCancelBtn.parentNode.replaceChild(newCancelBtn, waitingInputCancelBtn);
    waitingInputCancelBtn = newCancelBtn;
    
    // Add new event listener
    waitingInputCancelBtn.addEventListener('click', () => {
      hideWaitingInputDialog();
    });
  }
}

/**
 * Save the waiting input for a project
 * @param {Object} project The project to update
 */
function saveWaitingInput(project) {
  console.log('Saving waiting input');
  
  if (!waitingInputText) {
    console.error('Waiting input text element not found');
    return;
  }
  
  const waitingInput = waitingInputText.value.trim();
  
  if (!waitingInput) {
    uiManager.showNotification('Please enter what you are waiting for', 'error');
    return;
  }
  
  // Update project status to waiting with input
  projectData.updateProjectStatus(project, 'waiting', waitingInput)
    .then(() => {
      uiManager.showNotification(`Moved "${project.title}" to waiting`, 'success');
      hideWaitingInputDialog();
      moveToNextProject();
    })
    .catch(error => {
      console.error('Error moving project to waiting:', error);
      uiManager.showNotification(`Error moving project to waiting: ${error.message}`, 'error');
      hideWaitingInputDialog();
    });
}

/**
 * Hide the waiting input dialog
 */
function hideWaitingInputDialog() {
  console.log('Hiding waiting input dialog');
  
  if (waitingInputDialog) {
    waitingInputDialog.style.display = 'none';
  }
}

/**
 * Set up review event listeners
 */
function setupReviewEventListeners() {
  console.log('Setting up review event listeners');
  
  // Set up start review button
  const startReviewBtn = document.getElementById('start-review-btn');
  if (startReviewBtn) {
    startReviewBtn.addEventListener('click', () => {
      console.log('Start review button clicked');
      startProjectReview();
    });
  }
  
  // Set up next review button
  const nextReviewBtn = document.getElementById('next-review-btn');
  if (nextReviewBtn) {
    nextReviewBtn.addEventListener('click', () => {
      console.log('Next review button clicked');
      moveToNextProject();
    });
  }
  
  console.log('Review event listeners set up');
}

/**
 * Get the current project being reviewed
 * @returns {Object|null} The current project or null if not in review mode
 */
function getCurrentReviewProject() {
  if (!isInReviewMode || !reviewProjects || currentReviewIndex >= reviewProjects.length) {
    return null;
  }
  
  return reviewProjects[currentReviewIndex];
}

/**
 * Check if in review mode
 * @returns {boolean} True if in review mode, false otherwise
 */
function isReviewMode() {
  return isInReviewMode;
}

module.exports = {
  initializeReviewElements,
  startProjectReview,
  moveToNextProject,
  cancelReview,
  showWaitingInputDialog,
  setupReviewEventListeners,
  getCurrentReviewProject,
  isReviewMode
};
