// Project events module
const projectData = require('../projectData');
const uiManager = require('../uiManager');

// Global variables for event handling
let isFormDirty = false;
let isProjectModalOpen = false;

/**
 * Create a new project
 */
function createNewProject() {
  console.log('Creating new project');
  
  // Get project modal elements
  const projectModal = document.getElementById('project-modal');
  const projectTitle = document.getElementById('project-title');
  const projectContent = document.getElementById('project-content');
  const projectActive = document.getElementById('project-active');
  const projectSomeday = document.getElementById('project-someday');
  const projectArchive = document.getElementById('project-archive');
  const projectWaiting = document.getElementById('project-waiting');
  const projectWaitingInput = document.getElementById('project-waiting-input');
  
  if (!projectModal || !projectTitle || !projectContent) {
    console.error('Project modal elements not found');
    uiManager.showNotification('Error: Could not create new project', 'error');
    return;
  }
  
  // Reset current project
  projectData.setCurrentProject(null);
  
  // Clear form fields
  projectTitle.value = '';
  projectContent.value = '';
  
  // Set default status
  if (projectActive) projectActive.checked = true;
  if (projectSomeday) projectSomeday.checked = false;
  if (projectArchive) projectArchive.checked = false;
  if (projectWaiting) {
    projectWaiting.checked = false;
    if (projectWaitingInput) {
      projectWaitingInput.style.display = 'none';
      projectWaitingInput.value = '';
    }
  }
  
  // Show the modal
  projectModal.style.display = 'block';
  isProjectModalOpen = true;
  isFormDirty = false;
  
  // Focus on the title field
  projectTitle.focus();
  
  console.log('New project modal opened');
}

/**
 * Save the current project
 */
async function saveProject() {
  console.log('Saving project');
  
  try {
    const result = await projectData.saveProjectChanges();
    
    if (result) {
      console.log('Project saved successfully');
      uiManager.showNotification('Project saved successfully', 'success');
      
      // Close the modal
      closeProjectModal();
      
      // Reload projects
      const renderer = require('../../renderer-new');
      await renderer.loadAndRenderProjects();
    } else {
      console.error('Failed to save project');
      uiManager.showNotification('Failed to save project', 'error');
    }
  } catch (error) {
    console.error('Error saving project:', error);
    uiManager.showNotification('Error saving project: ' + error.message, 'error');
  }
}

/**
 * Close the project modal
 */
function closeProjectModal() {
  const projectModal = document.getElementById('project-modal');
  if (projectModal) {
    projectModal.style.display = 'none';
    isProjectModalOpen = false;
    isFormDirty = false;
  }
}

/**
 * Setup project event listeners
 */
function setupProjectEventListeners() {
  console.log('Setting up project event listeners');
  
  // Set up new project button
  const newProjectBtn = document.getElementById('new-project-btn');
  if (newProjectBtn) {
    newProjectBtn.addEventListener('click', () => {
      console.log('New project button clicked');
      createNewProject();
    });
  }
  
  // Set up save project button
  const saveProjectBtn = document.getElementById('save-project-btn');
  if (saveProjectBtn) {
    saveProjectBtn.addEventListener('click', async () => {
      console.log('Save project button clicked');
      await saveProject();
    });
  }
  
  // Set up modal close button
  const modalClose = document.querySelector('.close');
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      console.log('Modal close button clicked');
      closeProjectModal();
    });
  }
  
  // Set up project status toggles
  const projectWaiting = document.getElementById('project-waiting');
  if (projectWaiting) {
    projectWaiting.addEventListener('change', () => {
      console.log('Project waiting toggle changed');
      const waitingInput = document.getElementById('project-waiting-input');
      if (waitingInput) {
        waitingInput.style.display = projectWaiting.checked ? 'block' : 'none';
      }
    });
  }
  
  // Set up form change detection
  const formElements = document.querySelectorAll('#project-form input, #project-form textarea');
  formElements.forEach(element => {
    element.addEventListener('change', () => {
      isFormDirty = true;
    });
    
    if (element.tagName === 'TEXTAREA') {
      element.addEventListener('keyup', () => {
        isFormDirty = true;
      });
    }
  });
  
  // Set up window beforeunload event
  window.addEventListener('beforeunload', (e) => {
    if (isFormDirty && isProjectModalOpen) {
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  });
  
  console.log('Project event listeners set up');
}

module.exports = {
  createNewProject,
  saveProject,
  closeProjectModal,
  setupProjectEventListeners,
  isFormDirty,
  isProjectModalOpen
};
