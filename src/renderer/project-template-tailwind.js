/**
 * Creates a project item HTML element with Tailwind CSS classes
 * @param {Object} project - The project data
 * @param {string} tabId - The ID of the tab this project belongs to
 * @returns {HTMLElement} - The project item element
 */
function createProjectItem(project, tabId) {
  // Ensure project is an object
  if (!project || typeof project !== 'object') {
    console.error('Invalid project data:', project);
    const errorItem = document.createElement('div');
    errorItem.className = 'project-item error';
    errorItem.innerHTML = `<div class="p-4 text-error-600">Invalid project data</div>`;
    return errorItem;
  }

  const projectItem = document.createElement('div');
  projectItem.className = 'project-item';
  
  // Use filename as id if id is not available
  projectItem.dataset.id = project.id || project.filename || '';
  projectItem.dataset.title = project.title || '';
  projectItem.dataset.lastModified = project.lastModified || new Date().toISOString();
  
  // Calculate progress percentage
  let progressPercentage = 0;
  
  // Handle different ways tasks might be represented
  if (project.completionPercentage !== undefined) {
    // Use pre-calculated percentage if available
    progressPercentage = Math.round(project.completionPercentage);
  } else if (project.totalTasks && project.completedTasks) {
    // Calculate from totalTasks and completedTasks
    progressPercentage = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
  } else if (project.tasks && Array.isArray(project.tasks)) {
    // Calculate from tasks array
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.completed).length;
    progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }
  
  // Format the last modified date
  let formattedDate = 'Unknown date';
  try {
    if (project.lastModified) {
      const lastModifiedDate = new Date(project.lastModified);
      formattedDate = lastModifiedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  // Determine if the project is well-formulated
  const isWellFormulated = project.isWellFormulated || 
                          (project.endState && project.endState.trim() !== '');
  
  // Create the project item content
  projectItem.innerHTML = `
    <div class="flex flex-col h-full">
      <div class="flex-1">
        <h3 class="project-title">${project.title || 'Untitled Project'}</h3>
        <div class="project-last-modified">Last modified: ${formattedDate}</div>
        
        <div class="project-end-state mb-3">
          ${isWellFormulated 
            ? `<div class="text-sm text-success-600 dark:text-success-400 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Well formulated
              </div>`
            : `<div class="text-sm text-error-600 dark:text-error-400 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                Needs improvement
              </div>`
          }
        </div>
        
        <div class="project-progress mb-4">
          <div class="flex justify-between text-xs mb-1">
            <span>${progressPercentage}% Complete</span>
            <span>${project.completedTasks || 0}/${project.totalTasks || 0} Tasks</span>
          </div>
          <div class="bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 overflow-hidden">
            <div class="bg-primary-500 h-full rounded-full" style="width: ${progressPercentage}%"></div>
          </div>
        </div>
      </div>
      
      <div class="project-actions flex justify-between mt-4">
        <button class="btn btn-sm btn-secondary open-project" data-id="${project.id || project.filename || ''}">
          Open
        </button>
        
        ${tabId === 'archive' 
          ? `<button class="btn btn-sm btn-primary restore-project" data-id="${project.id || project.filename || ''}">
              Restore
            </button>`
          : `<button class="btn btn-sm btn-primary move-to-waiting" data-id="${project.id || project.filename || ''}">
              Move to Waiting
            </button>`
        }
      </div>
    </div>
  `;
  
  // Add event listeners
  const openBtn = projectItem.querySelector('.open-project');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openProjectModal(project);
    });
  }
  
  const moveToWaitingBtn = projectItem.querySelector('.move-to-waiting');
  if (moveToWaitingBtn) {
    moveToWaitingBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveToWaiting(project.id || project.filename);
    });
  }
  
  const restoreBtn = projectItem.querySelector('.restore-project');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      restoreProject(project.id || project.filename);
    });
  }
  
  // Make the entire card clickable
  projectItem.addEventListener('click', () => {
    openProjectModal(project);
  });
  
  return projectItem;
}

/**
 * Creates a notification element
 * @param {string} message - The notification message
 * @param {string} type - The type of notification (success, error, info)
 * @returns {HTMLElement} - The notification element
 */
function createNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Icon based on notification type
  let icon = '';
  if (type === 'success') {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success-500" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>`;
  } else if (type === 'error') {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error-500" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>`;
  } else {
    icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clip-rule="evenodd" />
    </svg>`;
  }
  
  notification.innerHTML = `
    <div class="flex-shrink-0">
      ${icon}
    </div>
    <div class="flex-1">
      ${message}
    </div>
    <button class="close-notification ml-2 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  `;
  
  // Add event listener to close button
  const closeBtn = notification.querySelector('.close-notification');
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('opacity-0');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
  
  return notification;
}

// Export the functions to the global scope
window.createProjectItem = createProjectItem;
window.createNotification = createNotification;

// Also keep the module.exports for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createProjectItem,
    createNotification
  };
} 