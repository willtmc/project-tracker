// UI management module

// UI elements cache
let projectModal = null;
let modalClose = null;
let projectTitle = null;
let projectContent = null;
let projectActive = null;
let projectSomeday = null;
let projectArchive = null;
let projectWaiting = null;
let projectWaitingInput = null;
let activeContainer = null;
let waitingContainer = null;
let somedayContainer = null;
let archiveContainer = null;
let notificationContainer = null;

/**
 * Initialize UI elements
 */
function initializeUI() {
  console.log('Initializing UI elements');

  // Get modal elements
  projectModal = document.getElementById('project-modal');
  modalClose = document.querySelector('.close');
  projectTitle = document.getElementById('project-title');
  projectContent = document.getElementById('project-content');
  projectActive = document.getElementById('project-active');
  projectSomeday = document.getElementById('project-someday');
  projectArchive = document.getElementById('project-archive');
  projectWaiting = document.getElementById('project-waiting');
  projectWaitingInput = document.getElementById('project-waiting-input');

  // Get container elements - using the correct IDs from the HTML
  activeContainer = document.getElementById('active-projects');
  waitingContainer = document.getElementById('waiting-projects');
  somedayContainer = document.getElementById('someday-projects');
  archiveContainer = document.getElementById('archive-projects');
  notificationContainer = document.getElementById('notification-container');

  // Log UI initialization status
  console.log('UI elements initialized:', {
    projectModal: projectModal ? true : false,
    modalClose: modalClose ? true : false,
    projectTitle: projectTitle ? true : false,
    projectContent: projectContent ? true : false,
    projectActive: projectActive ? true : false,
    projectSomeday: projectSomeday ? true : false,
    projectArchive: projectArchive ? true : false,
    projectWaiting: projectWaiting ? true : false,
    projectWaitingInput: projectWaitingInput ? true : false,
    activeContainer: activeContainer ? true : false,
    waitingContainer: waitingContainer ? true : false,
    somedayContainer: somedayContainer ? true : false,
    archiveContainer: archiveContainer ? true : false,
    notificationContainer: notificationContainer ? true : false,
  });

  console.log('UI initialization complete');
}

/**
 * Render projects to a container
 * @param {Array} projects The projects to render
 * @param {HTMLElement} container The container to render to
 */
function renderProjects(projects, container) {
  if (!container) {
    console.error('Container not found for rendering projects');
    return;
  }

  console.log(`Rendering ${projects.length} projects to container`);

  // Clear the container
  container.innerHTML = '';

  // Create a projects grid for the projects
  const projectsGrid = document.createElement('div');
  projectsGrid.className = 'projects-grid';

  // Add each project to the grid
  projects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';

    // Create project title element
    const projectTitle = document.createElement('h3');
    projectTitle.textContent = project.title || 'Untitled Project';

    // Create project meta element
    const projectMeta = document.createElement('div');
    projectMeta.className = 'project-meta';

    // Add not-well-formulated indicator if applicable
    if (!project.isWellFormulated) {
      projectMeta.innerHTML =
        '<span class="validation-badge">Needs Improvement</span>';
    }

    // Create project content preview
    const projectPreview = document.createElement('p');
    projectPreview.className = 'project-preview';
    projectPreview.textContent = project.content
      ? project.content.substring(0, 100) + '...'
      : 'No content';

    // Add waiting badge if applicable
    if (project.isWaiting) {
      const waitingBadge = document.createElement('span');
      waitingBadge.className = 'waiting-badge';
      waitingBadge.textContent = 'Waiting';
      projectCard.appendChild(waitingBadge);
    }

    // Add click event to open the project
    projectCard.addEventListener('click', () => {
      openProjectModal(project);
    });

    // Add elements to the card
    projectCard.appendChild(projectTitle);
    projectCard.appendChild(projectMeta);
    projectCard.appendChild(projectPreview);

    // Add the card to the grid
    projectsGrid.appendChild(projectCard);
  });

  // Add the grid to the container
  container.appendChild(projectsGrid);
}

/**
 * Open project modal
 * @param {Object} project The project to open
 */
function openProjectModal(project) {
  if (!projectModal || !projectTitle || !projectContent) {
    console.error('Project modal elements not found');
    showNotification('Error: Could not open project modal', 'error');
    return;
  }

  console.log('Opening project modal for:', project.title);

  // Set current project
  const projectData = require('./projectData');
  projectData.setCurrentProject(project);

  // Set modal content
  projectTitle.value = project.title || '';
  projectContent.value = project.content || '';

  // Set status toggles
  if (projectActive)
    projectActive.checked = project.isActive && !project.isWaiting;
  if (projectSomeday)
    projectSomeday.checked = !project.isActive && !project.isWaiting;
  if (projectArchive) projectArchive.checked = false;
  if (projectWaiting) projectWaiting.checked = project.isWaiting;

  // Set waiting input
  if (projectWaitingInput) {
    projectWaitingInput.value = project.waitingInput || '';
    projectWaitingInput.style.display = project.isWaiting ? 'block' : 'none';
  }

  // Show the modal
  projectModal.style.display = 'block';
}

/**
 * Close project modal
 */
function closeModal() {
  if (projectModal) {
    projectModal.style.display = 'none';
  }
}

/**
 * Show notification
 * @param {string} message The notification message
 * @param {string} type The notification type (info, success, warning, error)
 * @param {number} duration The notification duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
  if (!notificationContainer) {
    console.error('Notification container not found');
    return;
  }

  console.log('Notification:', message, `(${type})`);

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  // Create message container to separate it from the close button
  const messageContainer = document.createElement('span');
  messageContainer.className = 'notification-message';
  messageContainer.textContent = message;
  notification.appendChild(messageContainer);

  // Add close button
  const closeBtn = document.createElement('span');
  closeBtn.className = 'notification-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });

  notification.appendChild(closeBtn);

  // Add to container
  notificationContainer.appendChild(notification);

  // Auto-remove after duration
  setTimeout(() => {
    notification.remove();
  }, duration);
}

module.exports = {
  initializeUI,
  renderProjects,
  openProjectModal,
  closeModal,
  showNotification,
};
