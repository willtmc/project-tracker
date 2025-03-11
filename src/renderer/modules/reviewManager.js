// Review manager module
const projectData = require('./projectData');
const uiManager = require('./uiManager');
const { marked } = require('marked');
const workflowManager = require('./workflowManager');

// Review state variables
let isInReviewMode = false;
let currentReviewIndex = 0;
let reviewProjects = [];
let duplicateGroups = [];
let currentDuplicateGroup = null;
let isReviewingDuplicates = false;

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
    <p>Reviewing project <strong>1</strong> of <strong>${reviewProjects.length}</strong></p>
  `;
  
  // Hide start review button and show next review button
  const startReviewBtn = document.getElementById('start-review-btn');
  const nextReviewBtn = document.getElementById('next-review-btn');
  const completeReviewBtn = document.getElementById('complete-review-btn');
  
  if (startReviewBtn) {
    startReviewBtn.style.display = 'none';
  }
  
  if (nextReviewBtn) {
    nextReviewBtn.disabled = false;
  }
  
  if (completeReviewBtn) {
    completeReviewBtn.style.display = 'none';
  }
  
  // Display the first project
  displayCurrentProject();
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
  console.log('Moving to next project');
  
  // Increment review index
  currentReviewIndex++;
  
  // Check if we've reached the end of the projects
  if (currentReviewIndex >= reviewProjects.length) {
    console.log('Reached the end of review projects');
    
    // Show completion message
    if (reviewProjectTitle) {
      reviewProjectTitle.textContent = 'Review Complete!';
    }
    
    if (reviewProjectContent) {
      reviewProjectContent.innerHTML = `
        <div class="review-complete">
          <h3>🎉 All projects have been reviewed!</h3>
          <p>You have successfully reviewed all ${reviewProjects.length} projects.</p>
          <p>Click the "Complete Review" button to finish the review process.</p>
        </div>
      `;
    }
    
    // Update instructions
    if (reviewInstructions) {
      reviewInstructions.innerHTML = `
        <h3>Review Complete</h3>
        <p>You have reviewed all ${reviewProjects.length} projects.</p>
        <p>Click the "Complete Review" button to finish.</p>
      `;
    }
    
    // Show complete review button and hide next button
    const nextReviewBtn = document.getElementById('next-review-btn');
    const completeReviewBtn = document.getElementById('complete-review-btn');
    
    if (nextReviewBtn) {
      nextReviewBtn.disabled = true;
    }
    
    if (completeReviewBtn) {
      completeReviewBtn.style.display = 'block';
    }
    
    return;
  }
  
  // Display the next project
  displayCurrentProject();
}

/**
 * End the review process
 */
function endReview() {
  console.log('Ending review');
  
  // Reset review state
  isInReviewMode = false;
  currentReviewIndex = 0;
  reviewProjects = [];
  
  // Hide review container
  if (reviewContainer) {
    reviewContainer.style.display = 'none';
  }
  
  // Reset UI elements
  if (reviewProjectTitle) {
    reviewProjectTitle.textContent = 'Select Start to begin review';
  }
  
  if (reviewProjectContent) {
    reviewProjectContent.innerHTML = '';
  }
  
  // Reset buttons
  const nextReviewBtn = document.getElementById('next-review-btn');
  const completeReviewBtn = document.getElementById('complete-review-btn');
  const startReviewBtn = document.getElementById('start-review-btn');
  
  if (nextReviewBtn) {
    nextReviewBtn.disabled = true;
  }
  
  if (completeReviewBtn) {
    completeReviewBtn.style.display = 'none';
  }
  
  if (startReviewBtn) {
    startReviewBtn.style.display = 'block';
  }
  
  // Show notification
  uiManager.showNotification('Project sorting completed! Moving to well-formulation phase...', 'success');
  
  // Move to the next workflow step if we're in a workflow
  try {
    if (workflowManager && 
        typeof workflowManager.getCurrentWorkflowStep === 'function' && 
        workflowManager.getCurrentWorkflowStep() === workflowManager.WORKFLOW_STEPS.PROJECT_SORTING) {
      // Short delay before moving to next phase for better user experience
      setTimeout(() => {
        workflowManager.moveToNextWorkflowStep();
      }, 1000);
    }
  } catch (error) {
    console.error('Error moving to next workflow step:', error);
  }
  
  // Short delay before starting the well-formulation phase
  setTimeout(() => {
    // Start the well-formulation phase automatically
    workflowManager.executeNextPhase();
  }, 1500);
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
  
  // Set up complete review button
  const completeReviewBtn = document.getElementById('complete-review-btn');
  if (completeReviewBtn) {
    completeReviewBtn.addEventListener('click', () => {
      console.log('Complete review button clicked');
      endReview();
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

/**
 * Find potential duplicate projects
 * @returns {Promise<boolean>} True if duplicates were found, false otherwise
 */
async function findDuplicateProjects() {
  console.log('Finding duplicate projects');
  
  try {
    // Find potential duplicates
    duplicateGroups = await projectData.findPotentialDuplicates();
    
    if (duplicateGroups && duplicateGroups.length > 0) {
      console.log(`Found ${duplicateGroups.length} potential duplicate groups`);
      return true;
    } else {
      console.log('No potential duplicates found');
      return false;
    }
  } catch (error) {
    console.error('Error finding duplicate projects:', error);
    return false;
  }
}

/**
 * Start reviewing duplicate projects
 */
async function startDuplicateReview() {
  console.log('Starting duplicate project review');
  
  // Check if there are duplicate groups
  if (!duplicateGroups || duplicateGroups.length === 0) {
    const hasDuplicates = await findDuplicateProjects();
    if (!hasDuplicates) {
      uiManager.showNotification('No duplicate projects found', 'info');
      return false;
    }
  }
  
  // Set review mode
  isInReviewMode = true;
  isReviewingDuplicates = true;
  
  // Reset duplicate index
  currentDuplicateGroup = duplicateGroups[0];
  
  // Show review container
  reviewContainer.style.display = 'block';
  
  // Show review instructions for duplicates
  reviewInstructions.innerHTML = `
    <h3>Duplicate Project Review</h3>
    <p>The following projects appear to be duplicates:</p>
    <div id="duplicate-list" class="duplicate-list"></div>
    <div class="duplicate-actions">
      <button id="merge-duplicates-btn" class="btn btn-primary">Merge Projects</button>
      <button id="skip-duplicates-btn" class="btn btn-secondary">Skip (Not Duplicates)</button>
      <button id="cancel-duplicate-review-btn" class="btn btn-danger">Cancel Review</button>
    </div>
  `;
  
  // Add event listeners for duplicate review buttons
  document.getElementById('merge-duplicates-btn').addEventListener('click', mergeDuplicateProjects);
  document.getElementById('skip-duplicates-btn').addEventListener('click', skipDuplicateGroup);
  document.getElementById('cancel-duplicate-review-btn').addEventListener('click', cancelReview);
  
  // Display current duplicate group
  displayDuplicateGroup();
  
  console.log('Duplicate project review started');
  return true;
}

/**
 * Display the current duplicate group
 */
function displayDuplicateGroup() {
  if (!currentDuplicateGroup || currentDuplicateGroup.length === 0) {
    console.error('No duplicate group to display');
    return;
  }
  
  console.log('Displaying duplicate group:', currentDuplicateGroup);
  
  // Get the duplicate list container
  const duplicateList = document.getElementById('duplicate-list');
  if (!duplicateList) {
    console.error('Duplicate list container not found');
    return;
  }
  
  // Clear the duplicate list
  duplicateList.innerHTML = '';
  
  // Create a container for each project in the duplicate group
  currentDuplicateGroup.forEach((project, index) => {
    const projectContainer = document.createElement('div');
    projectContainer.className = 'duplicate-project';
    projectContainer.dataset.path = project.path;
    
    // Create project header with title and path
    const projectHeader = document.createElement('div');
    projectHeader.className = 'duplicate-project-header';
    projectHeader.innerHTML = `
      <h4>${project.title || 'Untitled Project'}</h4>
      <small>${project.path}</small>
    `;
    
    // Create project content preview
    const projectContent = document.createElement('div');
    projectContent.className = 'duplicate-project-content';
    projectContent.innerHTML = marked.parse(project.content.substring(0, 300) + '...');
    
    // Add to project container
    projectContainer.appendChild(projectHeader);
    projectContainer.appendChild(projectContent);
    
    // Add to duplicate list
    duplicateList.appendChild(projectContainer);
  });
}

/**
 * Merge the current duplicate group
 */
async function mergeDuplicateProjects() {
  if (!currentDuplicateGroup || currentDuplicateGroup.length < 2) {
    console.error('No duplicate group to merge');
    return;
  }
  
  console.log('Merging duplicate projects:', currentDuplicateGroup);
  
  try {
    // Get project paths
    const projectPaths = currentDuplicateGroup.map(project => project.path);
    
    // Merge projects
    const result = await projectData.mergeDuplicateProjects(projectPaths);
    
    if (result.success) {
      uiManager.showNotification('Projects merged successfully', 'success');
      
      // Move to next duplicate group
      moveToNextDuplicateGroup();
    } else {
      uiManager.showNotification(`Error merging projects: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error merging duplicate projects:', error);
    uiManager.showNotification('Error merging projects', 'error');
  }
}

/**
 * Skip the current duplicate group
 */
function skipDuplicateGroup() {
  console.log('Skipping duplicate group');
  moveToNextDuplicateGroup();
}

/**
 * Move to the next duplicate group
 */
function moveToNextDuplicateGroup() {
  // Find the index of the current duplicate group
  const currentIndex = duplicateGroups.findIndex(group => 
    group === currentDuplicateGroup
  );
  
  // Move to the next group
  if (currentIndex < duplicateGroups.length - 1) {
    currentDuplicateGroup = duplicateGroups[currentIndex + 1];
    displayDuplicateGroup();
  } else {
    // No more duplicate groups, end review
    endDuplicateReview();
  }
}

/**
 * End the duplicate review process
 */
function endDuplicateReview() {
  console.log('Ending duplicate review');
  
  // Reset review state
  isInReviewMode = false;
  isReviewingDuplicates = false;
  currentDuplicateGroup = null;
  
  // Hide review container
  reviewContainer.style.display = 'none';
  
  // Show notification
  uiManager.showNotification('Duplicate review completed', 'success');
  
  // Reload projects to refresh the list
  projectData.loadProjects().then(() => {
    // Trigger event to refresh project list
    document.dispatchEvent(new CustomEvent('projects-updated'));
  });
}

/**
 * Handle keyboard events during review mode
 * @param {KeyboardEvent} event The keyboard event
 */
function handleReviewKeydown(event) {
  if (!isInReviewMode) {
    return;
  }
  
  console.log(`Review keydown: ${event.key}`);
  
  // Get current project
  const currentProject = getCurrentReviewProject();
  if (!currentProject) {
    console.error('No current project to review');
    return;
  }
  
  // Handle different keys
  switch (event.key.toLowerCase()) {
    case 'y': // Yes - keep project active
      console.log('Keeping project active');
      uiManager.showNotification('Project kept active', 'success');
      moveToNextProject();
      break;
      
    case 'a': // Archive project
      console.log('Archiving project');
      projectData.updateProjectStatus(currentProject, 'archive')
        .then(() => {
          uiManager.showNotification('Project archived', 'success');
          moveToNextProject();
        })
        .catch(error => {
          console.error('Error archiving project:', error);
          uiManager.showNotification('Error archiving project', 'error');
        });
      break;
      
    case 's': // Move to someday
      console.log('Moving project to someday');
      projectData.updateProjectStatus(currentProject, 'someday')
        .then(() => {
          uiManager.showNotification('Project moved to someday', 'success');
          moveToNextProject();
        })
        .catch(error => {
          console.error('Error moving project to someday:', error);
          uiManager.showNotification('Error moving project to someday', 'error');
        });
      break;
      
    case 'w': // Move to waiting
      console.log('Moving project to waiting');
      showWaitingInputDialog(currentProject);
      break;
      
    default:
      // Ignore other keys
      break;
  }
}

module.exports = {
  initializeReviewElements,
  startProjectReview,
  moveToNextProject,
  cancelReview,
  showWaitingInputDialog,
  setupReviewEventListeners,
  getCurrentReviewProject,
  isReviewMode,
  startDuplicateReview,
  findDuplicateProjects,
  displayDuplicateGroup,
  mergeDuplicateProjects,
  skipDuplicateGroup,
  moveToNextDuplicateGroup,
  endDuplicateReview,
  handleReviewKeydown
};
