// Duplicate detection module
const { ipcRenderer } = require('electron');
const uiManager = require('./uiManager');
const projectData = require('./projectData');
const workflowManager = require('./workflowManager');

// State variables for duplicate detection
let duplicateGroups = [];
let currentDuplicateGroup = null;
let currentDuplicateIndex = 0;
let isReviewingDuplicates = false;

/**
 * Start duplicate detection process
 * @returns {Promise<Object>} Result of the duplicate detection
 */
async function startDuplicateDetection() {
  console.log('Starting duplicate detection');
  
  try {
    // Show loading notification
    uiManager.showNotification('Searching for potential duplicate projects...', 'info');
    
    // Find potential duplicates
    const result = await ipcRenderer.invoke('find-potential-duplicates');
    console.log('Duplicate detection result:', result);
    
    // Check if we have valid duplicate groups
    if (result.success && result.duplicateGroups && Array.isArray(result.duplicateGroups) && result.duplicateGroups.length > 0) {
      // Store the duplicate groups
      duplicateGroups = result.duplicateGroups;
      console.log(`Found ${duplicateGroups.length} potential duplicate groups to review`);
      console.log('First duplicate group:', duplicateGroups[0]);
      
      // Show notification
      uiManager.showNotification(`Found ${duplicateGroups.length} potential duplicate groups`, 'success');
      
      // Start duplicate review
      startDuplicateReview();
      return { success: true, duplicateGroups };
    } else {
      console.log('No duplicates found or empty result:', result);
      uiManager.showNotification('No potential duplicate projects found', 'info');
      
      // Move to the next workflow step if we're in a workflow
      try {
        if (workflowManager && 
            typeof workflowManager.getCurrentWorkflowStep === 'function' && 
            workflowManager.getCurrentWorkflowStep() === workflowManager.WORKFLOW_STEPS.DUPLICATE_DETECTION) {
          workflowManager.moveToNextWorkflowStep();
        }
      } catch (error) {
        console.error('Error checking workflow step:', error);
      }
      
      return { success: false, message: 'No duplicates found' };
    }
  } catch (error) {
    console.error('Error in duplicate detection:', error);
    uiManager.showNotification('Error searching for duplicates', 'error');
    
    // Move to the next workflow step if we're in a workflow
    try {
      if (workflowManager && 
          typeof workflowManager.getCurrentWorkflowStep === 'function' && 
          workflowManager.getCurrentWorkflowStep() === workflowManager.WORKFLOW_STEPS.DUPLICATE_DETECTION) {
        workflowManager.moveToNextWorkflowStep();
      }
    } catch (error) {
      console.error('Error moving to next workflow step:', error);
    }
    
    return { success: false, message: error.message };
  }
}

/**
 * Start reviewing duplicate projects
 */
function startDuplicateReview() {
  console.log('Starting duplicate review');
  
  if (!duplicateGroups || duplicateGroups.length === 0) {
    console.error('No duplicate groups to review');
    uiManager.showNotification('No duplicate groups to review', 'error');
    return;
  }
  
  // Set review mode
  isReviewingDuplicates = true;
  
  // Set current duplicate group to the first group
  currentDuplicateIndex = 0;
  currentDuplicateGroup = duplicateGroups[currentDuplicateIndex];
  console.log('Current duplicate group set to:', currentDuplicateGroup);
  
  // Show duplicate review container
  const duplicateReviewContainer = document.getElementById('duplicate-review-container');
  if (duplicateReviewContainer) {
    duplicateReviewContainer.style.display = 'block';
    console.log('Duplicate review container displayed');
  } else {
    console.error('Duplicate review container not found in DOM');
  }
  
  // Make sure we're on the review tab
  const reviewTab = document.getElementById('review-tab');
  if (reviewTab) {
    // Find all tab panes and hide them
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => pane.style.display = 'none');
    
    // Show the review tab
    reviewTab.style.display = 'block';
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    const reviewTabBtn = document.querySelector('.tab-btn[data-tab="review"]');
    if (reviewTabBtn) {
      reviewTabBtn.classList.add('active');
    }
  }
  
  // Display the first duplicate group
  displayDuplicateGroup();
}

/**
 * Display the current duplicate group
 */
function displayDuplicateGroup() {
  if (!currentDuplicateGroup || currentDuplicateGroup.length === 0) {
    console.error('No duplicate group to display');
    return;
  }
  
  console.log('Displaying duplicate group with', currentDuplicateGroup.length, 'projects');
  
  // Get the duplicate list container
  const duplicateList = document.getElementById('duplicate-list');
  if (!duplicateList) {
    console.error('Duplicate list container not found');
    return;
  }
  
  // Clear the duplicate list
  duplicateList.innerHTML = '';
  
  // Add group counter
  const groupCounter = document.createElement('div');
  groupCounter.className = 'duplicate-group-counter';
  groupCounter.textContent = `Group ${currentDuplicateIndex + 1} of ${duplicateGroups.length}`;
  duplicateList.appendChild(groupCounter);
  
  // Create a container for each project in the duplicate group
  currentDuplicateGroup.forEach(project => {
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
    projectContent.textContent = project.content ? (project.content.substring(0, 300) + '...') : 'No content available';
    
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
  
  console.log('Merging duplicate projects');
  
  try {
    // Show loading notification
    uiManager.showNotification('Merging duplicate projects...', 'info');
    
    // Get project paths
    const projectPaths = currentDuplicateGroup.map(project => project.path);
    
    // Merge projects
    const result = await ipcRenderer.invoke('merge-duplicate-projects', { projectPaths });
    
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
  uiManager.showNotification('Skipped duplicate group', 'info');
  moveToNextDuplicateGroup();
}

/**
 * Move to the next duplicate group
 */
function moveToNextDuplicateGroup() {
  // Increment index
  currentDuplicateIndex++;
  
  // Check if we've reached the end of the duplicate groups
  if (currentDuplicateIndex >= duplicateGroups.length) {
    console.log('Reached the end of duplicate groups');
    uiManager.showNotification('All duplicate groups reviewed', 'success');
    endDuplicateReview();
    return;
  }
  
  // Set the next duplicate group
  currentDuplicateGroup = duplicateGroups[currentDuplicateIndex];
  
  // Display the next duplicate group
  displayDuplicateGroup();
}

/**
 * End the duplicate review process
 */
function endDuplicateReview() {
  console.log('Ending duplicate review');
  
  // Reset state
  isReviewingDuplicates = false;
  duplicateGroups = [];
  currentDuplicateGroup = null;
  currentDuplicateIndex = 0;
  
  // Hide duplicate review container
  const duplicateReviewContainer = document.getElementById('duplicate-review-container');
  if (duplicateReviewContainer) {
    duplicateReviewContainer.style.display = 'none';
  }
  
  // Clear duplicate list
  const duplicateList = document.getElementById('duplicate-list');
  if (duplicateList) {
    duplicateList.innerHTML = '';
  }
  
  // Show notification
  uiManager.showNotification('Duplicate review completed! Moving to project sorting phase...', 'success');
  
  // Move to the next workflow step if we're in a workflow
  try {
    if (workflowManager && 
        typeof workflowManager.getCurrentWorkflowStep === 'function' && 
        workflowManager.getCurrentWorkflowStep() === workflowManager.WORKFLOW_STEPS.DUPLICATE_DETECTION) {
      // Short delay before moving to next phase for better user experience
      setTimeout(() => {
        // Automatically move to the next workflow step
        workflowManager.moveToNextWorkflowStep();
        
        // Short delay before starting the project sorting phase
        setTimeout(() => {
          // Start the project sorting phase automatically
          workflowManager.executeNextPhase();
        }, 1500);
      }, 1000);
    }
  } catch (error) {
    console.error('Error moving to next workflow step:', error);
  }
}

/**
 * Set up event listeners for duplicate review buttons
 */
function setupEventListeners() {
  // Merge button
  const mergeBtn = document.getElementById('merge-duplicates-btn');
  if (mergeBtn) {
    mergeBtn.addEventListener('click', async () => {
      await mergeDuplicateProjects();
    });
  }
  
  // Skip button
  const skipBtn = document.getElementById('skip-duplicate-btn');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      skipDuplicateGroup();
    });
  }
  
  // End review button
  const endReviewBtn = document.getElementById('end-duplicate-review-btn');
  if (endReviewBtn) {
    endReviewBtn.addEventListener('click', () => {
      endDuplicateReview();
    });
  }
  
  // Find duplicates button
  const findDuplicatesBtn = document.getElementById('find-duplicates-btn');
  if (findDuplicatesBtn) {
    findDuplicatesBtn.addEventListener('click', async () => {
      await startDuplicateDetection();
    });
  }
}

// Export functions for use in other modules
module.exports = {
  startDuplicateDetection,
  startDuplicateReview,
  displayDuplicateGroup,
  mergeDuplicateProjects,
  skipDuplicateGroup,
  moveToNextDuplicateGroup,
  endDuplicateReview,
  setupEventListeners,
  isReviewingDuplicates: () => isReviewingDuplicates
};
