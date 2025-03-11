// Project data module
const { ipcRenderer } = require('electron');

// Store projects data
let projectsData = null;
let currentProject = null;

/**
 * Load projects from all directories
 * @returns {Promise<Object>} The projects data
 */
async function loadProjects() {
  console.log('Loading projects');
  
  try {
    // Request projects from main process
    const projects = await ipcRenderer.invoke('get-projects');
    
    // Store projects data
    projectsData = projects;
    
    console.log('Projects loaded successfully');
    return projects;
  } catch (error) {
    console.error('Error loading projects:', error);
    throw error;
  }
}

/**
 * Get the stored projects data
 * @returns {Object} The projects data
 */
function getProjectsData() {
  return projectsData;
}

/**
 * Set the current project being edited
 * @param {Object} project The project to set as current
 */
function setCurrentProject(project) {
  console.log('Setting current project:', project ? project.title : 'null');
  currentProject = project;
}

/**
 * Get the current project being edited
 * @returns {Object} The current project
 */
function getCurrentProject() {
  return currentProject;
}

/**
 * Update a project's status
 * @param {Object} project The project to update
 * @param {string} targetStatus The target status (active, waiting, someday, archive)
 * @param {string} waitingInput Optional waiting input for waiting status
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function updateProjectStatus(project, targetStatus, waitingInput = null) {
  console.log(`Updating project status: ${project.title} to ${targetStatus}`);
  
  try {
    // Prepare project data for status update
    const projectData = {
      projectPath: project.path,
      targetStatus: targetStatus,
      isActive: targetStatus === 'active' || targetStatus === 'waiting',
      isWaiting: targetStatus === 'waiting',
      waitingInput: waitingInput
    };
    
    // Update project status through main process
    const result = await ipcRenderer.invoke('update-project-status', projectData);
    
    if (result && result.success) {
      console.log('Project status updated successfully');
      return true;
    } else {
      console.error('Failed to update project status:', result ? result.error : 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('Error updating project status:', error);
    return false;
  }
}

/**
 * Save project changes
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function saveProjectChanges() {
  console.log('Saving project changes');
  
  try {
    // Get form data
    const projectTitle = document.getElementById('project-title');
    const projectContent = document.getElementById('project-content');
    const projectActive = document.getElementById('project-active');
    const projectSomeday = document.getElementById('project-someday');
    const projectArchive = document.getElementById('project-archive');
    const projectWaiting = document.getElementById('project-waiting');
    const projectWaitingInput = document.getElementById('project-waiting-input');
    
    if (!projectTitle || !projectContent) {
      console.error('Project form elements not found');
      return false;
    }
    
    // Get status
    let status = 'active';
    if (projectActive && projectActive.checked) status = 'active';
    if (projectSomeday && projectSomeday.checked) status = 'someday';
    if (projectArchive && projectArchive.checked) status = 'archive';
    if (projectWaiting && projectWaiting.checked) status = 'waiting';
    
    // Get waiting input if applicable
    let waitingInput = null;
    if (status === 'waiting' && projectWaitingInput) {
      waitingInput = projectWaitingInput.value.trim();
      
      if (!waitingInput) {
        console.error('Waiting input is required for waiting status');
        return false;
      }
    }
    
    // Prepare project data
    const title = projectTitle.value.trim();
    const content = projectContent.value.trim();
    
    if (!title) {
      console.error('Project title is required');
      return false;
    }
    
    // Create or update project
    if (currentProject) {
      // Update existing project
      currentProject.title = title;
      currentProject.content = content;
      
      // Update project status if changed
      if (currentProject.status !== status) {
        const result = await updateProjectStatus(currentProject, status, waitingInput);
        return result;
      }
      
      return true;
    } else {
      // Create new project
      const newProject = {
        title: title,
        content: content,
        status: status,
        waitingInput: waitingInput
      };
      
      // Save new project through main process
      const result = await ipcRenderer.invoke('create-project', newProject);
      
      if (result && result.success) {
        console.log('New project created successfully');
        return true;
      } else {
        console.error('Failed to create new project:', result ? result.error : 'Unknown error');
        return false;
      }
    }
  } catch (error) {
    console.error('Error saving project changes:', error);
    return false;
  }
}

module.exports = {
  loadProjects,
  getProjectsData,
  setCurrentProject,
  getCurrentProject,
  updateProjectStatus,
  saveProjectChanges
};
