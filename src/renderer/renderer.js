// Renderer process
const { ipcRenderer } = require('electron');

console.log('Renderer process started');

// Global variables
let projectsData = {};
let currentProject = null;
let currentProjectPath = null;
let isFormulatingProject = false;

// UI elements
let projectModal, modalClose, projectTitle, projectActive;
let projectFormulation, projectNotes, projectStatus, statusIndicator;
let saveProjectBtn, cancelBtn, reformulateBtn;
let projectDetails, reportTimestamp, projectStats, recentActivity;

// Global variables for review mode
let isReviewMode = false;
let reviewProjects = [];
let currentReviewIndex = 0;
let currentReviewProject = null;

// Global references to review UI elements
let reviewProjectTitle;
let reviewProjectContent;
let reviewCount;
let reviewTotal;
let nextReviewBtn;
let waitingDialog, waitingInputText, saveWaitingBtn, cancelWaitingBtn;

// Flag to prevent multiple initializations
let isInitialized = false;

// Initialize the application
async function initializeApp() {
  console.log('Renderer process started');
  
  if (isInitialized) {
    console.log('App already initialized, skipping');
    return;
  }
  
  isInitialized = true;
  
  try {
    // Initialize UI elements
    await initializeUI();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Load projects
    const loadedProjects = await loadProjects();
    if (loadedProjects) {
      console.log('Projects loaded successfully');
    } else {
      console.error('Failed to load projects');
    }
    
    // Set the initial tab to active
    switchTab('active');
    
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

// Load all projects
async function loadProjects() {
  console.log('Loading projects...');
  try {
    const projectsResponse = await ipcRenderer.invoke('get-projects');
    console.log('Projects response:', projectsResponse);
    
    if (!projectsResponse) {
      console.error('No response from get-projects');
      showNotification('Error loading projects', 'error');
      return;
    }
    
    // Store projects data globally
    projectsData = projectsResponse;
    console.log('Projects data loaded:', projectsData);
    console.log(`Active projects: ${projectsData.active?.length || 0}`);
    console.log(`Waiting projects: ${projectsData.waiting?.length || 0}`);
    console.log(`Someday projects: ${projectsData.someday?.length || 0}`);
    console.log(`Archive projects: ${projectsData.archive?.length || 0}`);
    
    // Get project containers
    const activeProjectsContainer = document.getElementById('active-projects');
    const waitingProjectsContainer = document.getElementById('waiting-projects');
    const somedayProjectsContainer = document.getElementById('someday-projects');
    const archiveProjectsContainer = document.getElementById('archive-projects');
    
    // Get count elements
    const activeCountElement = document.getElementById('active-count');
    const waitingCountElement = document.getElementById('waiting-count');
    const somedayCountElement = document.getElementById('someday-count');
    const archiveCountElement = document.getElementById('archive-count');
    const completionRateElement = document.getElementById('completion-rate');
    
    // Render active projects
    if (activeProjectsContainer && projectsData.active) {
      console.log(`Rendering ${projectsData.active.length} active projects`);
      renderProjects(projectsData.active, activeProjectsContainer);
      
      if (activeCountElement) {
        activeCountElement.textContent = projectsData.active.length;
      }
    }
    
    // Render waiting projects
    if (waitingProjectsContainer && projectsData.waiting) {
      console.log(`Rendering ${projectsData.waiting.length} waiting projects`);
      renderProjects(projectsData.waiting, waitingProjectsContainer);
      
      if (waitingCountElement) {
        waitingCountElement.textContent = projectsData.waiting.length;
      }
    }
    
    // Render someday projects
    if (somedayProjectsContainer && projectsData.someday) {
      console.log(`Rendering ${projectsData.someday.length} someday projects`);
      renderProjects(projectsData.someday, somedayProjectsContainer);
      
      if (somedayCountElement) {
        somedayCountElement.textContent = projectsData.someday.length;
      }
    }
    
    // Render archive projects
    if (archiveProjectsContainer && projectsData.archive) {
      console.log(`Rendering ${projectsData.archive.length} archive projects`);
      renderProjects(projectsData.archive, archiveProjectsContainer);
      
      if (archiveCountElement) {
        archiveCountElement.textContent = projectsData.archive.length;
      }
    }
    
    // Calculate completion rate
    if (completionRateElement) {
      const totalProjects = (projectsData.active ? projectsData.active.length : 0) + 
                          (projectsData.waiting ? projectsData.waiting.length : 0) + 
                          (projectsData.someday ? projectsData.someday.length : 0) + 
                          (projectsData.archive ? projectsData.archive.length : 0);
      
      const completedProjects = projectsData.archive ? projectsData.archive.length : 0;
      const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
      
      completionRateElement.textContent = `${completionRate}%`;
    }
    
    return projectsData; // Return the loaded data
  } catch (error) {
    console.error('Error loading projects:', error);
    showNotification('Error loading projects', 'error');
    return null;
  }
}

// Render projects to a container
function renderProjects(projects, container) {
  console.log(`Rendering ${projects.length} projects to container`);
  
  // Debug: Check how many projects are active and need improvement
  const needsImprovementActiveProjects = projects.filter(p => p.status === 'active' && p.needsImprovement === true);
  console.log(`Found ${needsImprovementActiveProjects.length} active projects that need improvement:`, needsImprovementActiveProjects);
  
  // Clear container first
  container.innerHTML = '';
  
  if (!Array.isArray(projects) || projects.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No projects found';
    container.appendChild(emptyMessage);
    return;
  }
  
  // Sort projects by title
  projects.sort((a, b) => {
    const titleA = a.title || a.filename || '';
    const titleB = b.title || b.filename || '';
    return titleA.localeCompare(titleB);
  });
  
  // Create project elements
  for (const project of projects) {
    const projectElement = document.createElement('div');
    projectElement.className = 'project-item';
    projectElement.dataset.id = project.filename;
    
    const title = document.createElement('h3');
    title.textContent = project.title || project.filename || 'Untitled Project';
    projectElement.appendChild(title);
    
    // Add status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = `status-indicator ${project.status}`;
    statusIndicator.textContent = project.status.charAt(0).toUpperCase() + project.status.slice(1);
    projectElement.appendChild(statusIndicator);
    
    // Add not-well-formulated indicator for active projects
    if (project.status === 'active' && project.isWellFormulated === false) {
      console.log(`Adding not-well-formulated indicator to project: ${project.title || project.filename}`);
      const notWellFormulatedIndicator = document.createElement('div');
      notWellFormulatedIndicator.className = 'not-well-formulated';
      notWellFormulatedIndicator.title = 'This project is not well-formulated';
      projectElement.appendChild(notWellFormulatedIndicator);
    }
    // Add needs-improvement indicator for active projects
    else if (project.status === 'active' && project.needsImprovement === true) {
      console.log(`Adding needs-improvement indicator to project: ${project.title || project.filename}`);
      const needsImprovementIndicator = document.createElement('div');
      needsImprovementIndicator.className = 'needs-improvement';
      needsImprovementIndicator.title = 'This project could be improved with more details or tasks';
      projectElement.appendChild(needsImprovementIndicator);
    }
    
    // Add project details if available
    if (project.endState || project.waitingInput) {
      const details = document.createElement('div');
      details.className = 'project-details';
      
      if (project.endState) {
        const endState = document.createElement('p');
        endState.className = 'end-state';
        endState.textContent = `End state: ${project.endState}`;
        details.appendChild(endState);
      }
      
      if (project.waitingInput) {
        const waiting = document.createElement('p');
        waiting.className = 'waiting-info';
        waiting.textContent = `Waiting on: ${project.waitingInput}`;
        details.appendChild(waiting);
      }
      
      projectElement.appendChild(details);
    }
    
    // Add progress indicator if available
    if (project.totalTasks > 0) {
      const progressContainer = document.createElement('div');
      progressContainer.className = 'progress-container';
      
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      
      const completedTasks = project.completedTasks || 0;
      const progressPercent = Math.round((completedTasks / project.totalTasks) * 100);
      progressBar.style.width = `${progressPercent}%`;
      
      const progressText = document.createElement('span');
      progressText.className = 'progress-text';
      progressText.textContent = `${completedTasks}/${project.totalTasks} tasks`;
      
      progressContainer.appendChild(progressBar);
      progressContainer.appendChild(progressText);
      projectElement.appendChild(progressContainer);
    }
    
    // Add click event to open project
    projectElement.addEventListener('click', () => openProjectModal(project));
    
    container.appendChild(projectElement);
  }
}

// Open project modal
function openProjectModal(project) {
  if (!projectModal) return;
  
  console.log('Opening project modal for:', project.title);
  currentProject = project;
  
  // Set modal title
  if (modalTitle) {
    modalTitle.textContent = project.title || 'Untitled Project';
  }
  
  // Set project details
  const projectDetailsElement = document.getElementById('project-details');
  if (projectDetailsElement) {
    projectDetailsElement.textContent = project.content || '';
  }
  
  // Set form values
  if (projectActive) {
    projectActive.checked = project.isActive;
  }
  
  if (projectWaiting) {
    projectWaiting.checked = project.isWaiting;
  }
  
  if (waitingInput) {
    waitingInput.value = project.waitingInput || '';
  }
  
  if (waitingInputGroup) {
    waitingInputGroup.classList.toggle('hidden', !project.isWaiting);
  }
  
  // Show modal
  projectModal.style.display = 'block';
}

// Close project modal
function closeModal() {
  const projectModal = document.getElementById('project-modal');
  if (projectModal) {
    projectModal.style.display = 'none';
  }
}

// Generate report
async function generateReport() {
  console.log('Generating report');
  
  try {
    // Get report elements
    const reportTimestamp = document.getElementById('report-timestamp');
    const projectStats = document.getElementById('project-stats');
    const recentActivity = document.getElementById('recent-activity');
    
    if (!reportTimestamp || !projectStats || !recentActivity) {
      console.error('Report elements not found');
      showNotification('Error: Report elements not found', 'error');
      return;
    }
    
    // Update timestamp
    const now = new Date();
    reportTimestamp.textContent = `Report generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
    
    // Clear previous content
    projectStats.innerHTML = '';
    recentActivity.innerHTML = '';
    
    // Add project statistics
    const activeCount = projectsData.active ? projectsData.active.length : 0;
    const waitingCount = projectsData.waiting ? projectsData.waiting.length : 0;
    const somedayCount = projectsData.someday ? projectsData.someday.length : 0;
    const archiveCount = projectsData.archive ? projectsData.archive.length : 0;
    const totalCount = activeCount + waitingCount + somedayCount + archiveCount;
    const completionRate = totalCount > 0 ? Math.round((archiveCount / totalCount) * 100) : 0;
    
    const stats = [
      { label: 'Active Projects', value: activeCount },
      { label: 'Waiting Projects', value: waitingCount },
      { label: 'Someday Projects', value: somedayCount },
      { label: 'Archived Projects', value: archiveCount },
      { label: 'Total Projects', value: totalCount },
      { label: 'Completion Rate', value: `${completionRate}%` }
    ];
    
    stats.forEach(stat => {
      const statElement = document.createElement('div');
      statElement.className = 'report-stat';
      statElement.innerHTML = `
        <div class="report-stat-value">${stat.value}</div>
        <div class="report-stat-label">${stat.label}</div>
      `;
      projectStats.appendChild(statElement);
    });
    
    // Add recent activity (placeholder for now)
    const activityElement = document.createElement('div');
    activityElement.className = 'report-item';
    activityElement.innerHTML = `
      <strong>Report Feature</strong>
      <p>Detailed activity tracking will be implemented in a future update.</p>
    `;
    recentActivity.appendChild(activityElement);
    
    showNotification('Report generated successfully', 'success');
  } catch (error) {
    console.error('Error generating report:', error);
    showNotification('Error generating report', 'error');
  }
}

// Save project changes
async function saveProjectChanges() {
  if (!currentProject) {
    console.error('No project selected');
    return;
  }
  
  console.log('Saving project changes');
  
  try {
    // Determine new status
    let newStatus = currentProject.status;
    
    if (projectActive && projectActive.checked) {
      if (projectWaiting && projectWaiting.checked) {
        newStatus = 'waiting';
      } else {
        newStatus = 'active';
      }
    } else {
      newStatus = 'someday';
    }
    
    // Get waiting input if applicable
    let waitingInputValue = '';
    if (newStatus === 'waiting' && waitingInput) {
      waitingInputValue = waitingInput.value;
    }
    
    // Check if project has been reformulated or validated
    const isWellFormulated = currentProject.isWellFormulated || 
                           (validationSection && validationSection.classList.contains('hidden'));
    
    // Prepare updated project
    const updatedProject = {
      ...currentProject,
      status: newStatus,
      waitingInput: waitingInputValue,
      isWellFormulated: isWellFormulated
    };
    
    console.log('Updating project:', updatedProject);
    
    // Send to main process
    const result = await ipcRenderer.invoke('update-project', updatedProject);
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to update project');
    }
    
    // Show success message
    console.log('Project updated successfully');
    
    // Reload projects
    await loadProjects();
    
    // Close modal
    closeModal();
  } catch (error) {
    console.error('Error saving project changes:', error);
    alert('Error saving project: ' + error.message);
  }
}

// Switch between tabs
function switchTab(tabName) {
  console.log(`Switching to ${tabName} tab`);
  
  // Get all tab buttons and panes
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Hide all tab panes
  tabPanes.forEach(pane => {
    pane.style.display = 'none';
  });
  
  // Remove active class from all tab buttons
  tabButtons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Show the selected tab pane
  const selectedPane = document.getElementById(`${tabName}-tab`);
  if (selectedPane) {
    selectedPane.style.display = 'block';
  } else {
    console.error(`Tab pane ${tabName}-tab not found`);
  }
  
  // Add active class to the selected tab button
  const selectedButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  } else {
    console.error(`Tab button for ${tabName} not found`);
  }
  
  // If switching to review tab, ensure review elements are initialized
  if (tabName === 'review') {
    console.log('Initializing review elements');
    reviewProjectTitle = document.getElementById('review-project-title');
    reviewProjectContent = document.getElementById('review-project-content');
    reviewCount = document.getElementById('review-count');
    reviewTotal = document.getElementById('review-total');
    startReviewBtn = document.getElementById('start-review-btn');
    nextReviewBtn = document.getElementById('next-review-btn');
    
    console.log('Review elements after initialization:', {
      reviewProjectTitle: reviewProjectTitle ? true : false,
      reviewProjectContent: reviewProjectContent ? true : false,
      reviewCount: reviewCount ? true : false,
      reviewTotal: reviewTotal ? true : false,
      startReviewBtn: startReviewBtn ? true : false,
      nextReviewBtn: nextReviewBtn ? true : false
    });
  }
  
  console.log(`Switched to ${tabName} tab`);
}

// Start project review workflow
async function startProjectReview() {
  console.log('Starting project review');
  
  // Ensure we have the latest project data
  try {
    const refreshedData = await loadProjects();
    if (!refreshedData) {
      console.error('Failed to refresh project data');
      showNotification('Error refreshing project data', 'error');
      return;
    }
    console.log('Projects refreshed for review');
  } catch (error) {
    console.error('Error refreshing projects:', error);
    showNotification('Error refreshing projects', 'error');
    return;
  }
  
  console.log('Projects data:', projectsData);
  
  // Check if we have active projects to review
  if (!projectsData) {
    console.error('No projects data available');
    showNotification('Error: No projects data available', 'error');
    return;
  }
  
  console.log('Active projects:', projectsData.active);
  
  if (!projectsData.active || projectsData.active.length === 0) {
    console.log('No active projects found in projectsData');
    showNotification('No active projects to review', 'warning');
    return;
  }
  
  // Initialize review mode
  isReviewMode = true;
  reviewProjects = [...projectsData.active];
  currentReviewIndex = 0;
  
  console.log('Review projects array:', reviewProjects);
  console.log('First review project:', reviewProjects[0]);
  
  // Switch to review tab
  switchTab('review');
  
  // Show first project
  showReviewProject(reviewProjects[0]);
  
  // Update review count
  if (reviewCount && reviewTotal) {
    reviewCount.textContent = '1';
    reviewTotal.textContent = reviewProjects.length.toString();
  }
  
  // Add keyboard event listener if not already added
  if (!isReviewKeyboardListenerActive) {
    document.addEventListener('keydown', handleReviewKeydown);
    isReviewKeyboardListenerActive = true;
    console.log('Added review keyboard listener');
  }
  
  console.log('Review mode started with', reviewProjects.length, 'projects');
  showNotification(`Review mode started. Use keyboard shortcuts: Y (keep), A (archive), S (someday), W (waiting)`, 'success');
}

// Show a project for review
function showReviewProject(project) {
  console.log('Showing review project:', project);
  
  // Check if project is valid
  if (!project) {
    console.error('Invalid project for review');
    showNotification('Error: Invalid project for review', 'error');
    return;
  }
  
  // Store current project for review
  currentReviewProject = project;
  
  // Update UI elements
  if (reviewProjectTitle) {
    reviewProjectTitle.textContent = project.title || 'Untitled Project';
  } else {
    console.error('Review project title element not found');
  }
  
  if (reviewProjectContent) {
    // Use marked library to render markdown content if available
    if (typeof marked !== 'undefined') {
      reviewProjectContent.innerHTML = marked.parse(project.content || '');
    } else {
      reviewProjectContent.textContent = project.content || '';
    }
  } else {
    console.error('Review project content element not found');
  }
  
  // Enable next button
  if (nextReviewBtn) {
    nextReviewBtn.disabled = false;
  }
  
  console.log('Review project displayed successfully');
}

// Move to the next project in the review
function moveToNextReviewProject() {
  console.log('Moving to next review project');
  
  if (!reviewProjects || reviewProjects.length === 0) {
    console.error('No review projects available');
    showNotification('No more projects to review', 'info');
    endReviewMode();
    return;
  }
  
  // Increment index
  currentReviewIndex++;
  
  // Check if we've reached the end of the projects
  if (currentReviewIndex >= reviewProjects.length) {
    console.log('Reached the end of review projects');
    showNotification('All projects reviewed', 'success');
    endReviewMode();
    return;
  }
  
  // Show the next project
  showReviewProject(reviewProjects[currentReviewIndex]);
  
  // Update review count
  if (reviewCount && reviewTotal) {
    reviewCount.textContent = (currentReviewIndex + 1).toString();
    reviewTotal.textContent = reviewProjects.length.toString();
  }
  
  console.log(`Showing project ${currentReviewIndex + 1} of ${reviewProjects.length}`);
}

// Update project status
async function updateProjectStatus(project, options) {
  if (!project || !project.path) {
    console.error('Invalid project for status update');
    return false;
  }
  
  try {
    console.log('Updating project status:', project.title, options);
    
    // Prepare the update parameters
    const updateParams = {
      projectPath: project.path,
      isActive: options.targetStatus === 'active' || options.targetStatus === 'waiting',
      isWaiting: options.targetStatus === 'waiting',
      waitingInput: options.waitingInput || '',
      targetStatus: options.targetStatus
    };
    
    console.log('Update parameters:', updateParams);
    
    // Call the main process to update the project status
    const result = await ipcRenderer.invoke('update-project-status', updateParams);
    
    if (result.success) {
      console.log('Project status updated successfully');
      return true;
    } else {
      console.error('Failed to update project status:', result.error);
      showNotification('Error: ' + (result.error || 'Unknown error'), 'error');
      return false;
    }
  } catch (error) {
    console.error('Error updating project status:', error);
    showNotification('Error updating project', 'error');
    return false;
  }
}

// Show waiting input dialog
function showWaitingInputDialog() {
  console.log('Showing waiting input dialog');
  
  // Get the waiting input dialog elements
  const waitingDialog = document.getElementById('waiting-dialog');
  const waitingInputText = document.getElementById('waiting-input-text');
  const waitingSubmitBtn = document.getElementById('waiting-submit-btn');
  const waitingCancelBtn = document.getElementById('waiting-cancel-btn');
  
  if (!waitingDialog || !waitingInputText) {
    console.error('Waiting dialog elements not found');
    showNotification('Error: Could not open waiting dialog', 'error');
    return;
  }
  
  // Clear previous input
  waitingInputText.value = '';
  
  // Show the dialog
  waitingDialog.style.display = 'block';
  waitingInputText.focus();
  
  // Handle submit button click
  const handleSubmit = () => {
    const waitingInput = waitingInputText.value.trim();
    
    if (!waitingInput) {
      showNotification('Please enter what you are waiting for', 'warning');
      return;
    }
    
    console.log('Waiting input submitted:', waitingInput);
    
    // Update project status to waiting with the input
    updateProjectStatus(currentReviewProject, { 
      targetStatus: 'waiting',
      waitingInput: waitingInput
    }).then(success => {
      if (success) {
        showNotification('Project moved to waiting', 'success');
        closeWaitingDialog();
        moveToNextReviewProject();
      }
    });
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    console.log('Waiting input canceled');
    closeWaitingDialog();
  };
  
  // Remove existing event listeners to prevent duplicates
  if (waitingSubmitBtn) {
    waitingSubmitBtn.replaceWith(waitingSubmitBtn.cloneNode(true));
    const newSubmitBtn = document.getElementById('waiting-submit-btn');
    newSubmitBtn.addEventListener('click', handleSubmit);
  }
  
  if (waitingCancelBtn) {
    waitingCancelBtn.replaceWith(waitingCancelBtn.cloneNode(true));
    const newCancelBtn = document.getElementById('waiting-cancel-btn');
    newCancelBtn.addEventListener('click', handleCancel);
  }
  
  // Add keyboard event listener for Enter key
  waitingInputText.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  });
}

// Close waiting input dialog
function closeWaitingDialog() {
  const waitingDialog = document.getElementById('waiting-dialog');
  
  if (waitingDialog) {
    waitingDialog.style.display = 'none';
  }
}

// End review mode
function endReviewMode() {
  console.log('Ending review mode');
  isReviewMode = false;
  currentReviewProject = null;
  
  // Remove keyboard event listener
  document.removeEventListener('keydown', handleReviewKeydown);
  
  // Reset UI elements
  if (reviewProjectTitle) {
    reviewProjectTitle.textContent = 'Select Start to begin review';
  }
  
  if (reviewProjectContent) {
    reviewProjectContent.innerHTML = '';
  }
  
  // Switch back to active tab
  switchTab('active');
  
  // Refresh projects to show updated statuses
  loadProjects();
  
  // Show notification
  showNotification('Review mode ended', 'info');
}

// Start review mode functions for project evaluation with single keystrokes
function startReviewMode() {
  // Only start review mode if we have active projects
  if (!projectsData || !projectsData.active || projectsData.active.length === 0) {
    alert('No active projects to review.');
    return;
  }
  
  isReviewMode = true;
  reviewProjects = [...projectsData.active];
  currentReviewIndex = 0;
  
  // Create review overlay
  const reviewOverlay = document.createElement('div');
  reviewOverlay.className = 'review-overlay';
  reviewOverlay.id = 'reviewOverlay';
  
  // Create review container
  const reviewContainer = document.createElement('div');
  reviewContainer.className = 'review-container';
  reviewContainer.id = 'reviewContainer';
  
  // Add header
  const reviewHeader = document.createElement('div');
  reviewHeader.className = 'review-header';
  
  const reviewTitle = document.createElement('h2');
  reviewTitle.className = 'review-title';
  reviewTitle.textContent = 'Project Review Mode';
  
  const reviewProgress = document.createElement('div');
  reviewProgress.className = 'review-progress';
  reviewProgress.id = 'reviewProgress';
  reviewProgress.textContent = `Project 1 of ${reviewProjects.length}`;
  
  reviewHeader.appendChild(reviewTitle);
  reviewHeader.appendChild(reviewProgress);
  
  // Add progress bar
  const progressBarContainer = document.createElement('div');
  progressBarContainer.className = 'review-progress-bar';
  
  const progressBarFill = document.createElement('div');
  progressBarFill.className = 'review-progress-fill';
  progressBarFill.id = 'reviewProgressFill';
  progressBarFill.style.width = `${(1 / reviewProjects.length) * 100}%`;
  
  progressBarContainer.appendChild(progressBarFill);
  reviewHeader.appendChild(progressBarContainer);
  
  // Add content area
  const reviewContent = document.createElement('div');
  reviewContent.className = 'review-content';
  reviewContent.id = 'reviewContent';
  
  // Add stats
  const reviewStats = document.createElement('div');
  reviewStats.className = 'review-stats';
  
  // Tasks stat
  const tasksStatContainer = document.createElement('div');
  tasksStatContainer.className = 'review-stat';
  
  const tasksStatValue = document.createElement('div');
  tasksStatValue.className = 'review-stat-value';
  tasksStatValue.id = 'reviewTasksValue';
  tasksStatValue.textContent = '0';
  
  const tasksStatLabel = document.createElement('div');
  tasksStatLabel.className = 'review-stat-label';
  tasksStatLabel.textContent = 'Tasks';
  
  tasksStatContainer.appendChild(tasksStatValue);
  tasksStatContainer.appendChild(tasksStatLabel);
  
  // Completed stat
  const completedStatContainer = document.createElement('div');
  completedStatContainer.className = 'review-stat';
  
  const completedStatValue = document.createElement('div');
  completedStatValue.className = 'review-stat-value';
  completedStatValue.id = 'reviewCompletedValue';
  completedStatValue.textContent = '0';
  
  const completedStatLabel = document.createElement('div');
  completedStatLabel.className = 'review-stat-label';
  completedStatLabel.textContent = 'Completed';
  
  completedStatContainer.appendChild(completedStatValue);
  completedStatContainer.appendChild(completedStatLabel);
  
  // Progress stat
  const progressStatContainer = document.createElement('div');
  progressStatContainer.className = 'review-stat';
  
  const progressStatValue = document.createElement('div');
  progressStatValue.className = 'review-stat-value';
  progressStatValue.id = 'reviewProgressValue';
  progressStatValue.textContent = '0%';
  
  const progressStatLabel = document.createElement('div');
  progressStatLabel.className = 'review-stat-label';
  progressStatLabel.textContent = 'Progress';
  
  progressStatContainer.appendChild(progressStatValue);
  progressStatContainer.appendChild(progressStatLabel);
  
  reviewStats.appendChild(tasksStatContainer);
  reviewStats.appendChild(completedStatContainer);
  reviewStats.appendChild(progressStatContainer);
  
  // Add action buttons
  const reviewActions = document.createElement('div');
  reviewActions.className = 'review-actions';
  
  // Yes button
  const yesButton = document.createElement('button');
  yesButton.className = 'review-action-btn yes';
  yesButton.textContent = 'Keep Active (Y)';
  yesButton.onclick = () => handleReviewAction('yes');
  
  // Archive button
  const archiveButton = document.createElement('button');
  archiveButton.className = 'review-action-btn archive';
  archiveButton.textContent = 'Archive (A)';
  archiveButton.onclick = () => handleReviewAction('archive');
  
  // Someday button
  const somedayButton = document.createElement('button');
  somedayButton.className = 'review-action-btn someday';
  somedayButton.textContent = 'Someday (S)';
  somedayButton.onclick = () => handleReviewAction('someday');
  
  // Waiting button
  const waitingButton = document.createElement('button');
  waitingButton.className = 'review-action-btn waiting';
  waitingButton.textContent = 'Waiting (W)';
  waitingButton.onclick = () => handleReviewAction('waiting');
  
  // Exit button
  const exitButton = document.createElement('button');
  exitButton.className = 'review-action-btn exit';
  exitButton.textContent = 'Exit (Esc)';
  exitButton.onclick = () => handleReviewAction('exit');
  
  reviewActions.appendChild(yesButton);
  reviewActions.appendChild(archiveButton);
  reviewActions.appendChild(somedayButton);
  reviewActions.appendChild(waitingButton);
  reviewActions.appendChild(exitButton);
  
  // Add keyboard shortcuts info
  const reviewShortcuts = document.createElement('div');
  reviewShortcuts.className = 'review-shortcuts';
  reviewShortcuts.innerHTML = 'Keyboard shortcuts: <span class="review-shortcut">Y</span> Keep Active, <span class="review-shortcut">A</span> Archive, <span class="review-shortcut">S</span> Someday, <span class="review-shortcut">W</span> Waiting, <span class="review-shortcut">Esc</span> Exit';
  
  // Assemble the review container
  reviewContainer.appendChild(reviewHeader);
  reviewContainer.appendChild(reviewStats);
  reviewContainer.appendChild(reviewContent);
  reviewContainer.appendChild(reviewActions);
  reviewContainer.appendChild(reviewShortcuts);
  
  reviewOverlay.appendChild(reviewContainer);
  document.body.appendChild(reviewOverlay);
  
  // Set up keyboard shortcuts
  document.addEventListener('keydown', handleReviewKeydown);
  
  // Show the first project
  showReviewProject();
}

// Show the current project in review mode
function showReviewProject() {
  if (!isReviewMode) return;
  
  // Check if we've reviewed all projects
  if (currentReviewIndex >= reviewProjects.length) {
    showNotification('All projects reviewed!');
    setTimeout(() => {
      endReviewMode();
    }, 2000);
    return;
  }
  
  const project = reviewProjects[currentReviewIndex];
  const reviewContent = document.getElementById('reviewContent');
  const reviewProgress = document.getElementById('reviewProgress');
  const progressFill = document.getElementById('reviewProgressFill');
  
  // Update progress indicator
  reviewProgress.textContent = `Project ${currentReviewIndex + 1} of ${reviewProjects.length}`;
  progressFill.style.width = `${((currentReviewIndex + 1) / reviewProjects.length) * 100}%`;
  
  // Update stats
  document.getElementById('reviewTasksValue').textContent = project.totalTasks || 0;
  document.getElementById('reviewCompletedValue').textContent = project.completedTasks || 0;
  
  const progressPercent = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
  document.getElementById('reviewProgressValue').textContent = `${progressPercent}%`;
  
  // Display project content
  reviewContent.innerHTML = '';
  
  // Project title
  const projectTitle = document.createElement('h3');
  projectTitle.textContent = project.title || 'Untitled Project';
  reviewContent.appendChild(projectTitle);
  
  // Project metadata
  const metadata = document.createElement('div');
  metadata.style.marginBottom = '1rem';
  metadata.innerHTML = `
    <div><strong>File:</strong> ${project.filename}</div>
    <div><strong>Last Modified:</strong> ${new Date(project.lastModified).toLocaleString()}</div>
    ${project.isWellFormulated ? '<div style="color: #4caf50">✓ Well-formulated</div>' : '<div style="color: #f44336">✗ Needs improvement</div>'}
  `;
  reviewContent.appendChild(metadata);
  
  // Project content preview
  const contentPreview = document.createElement('pre');
  contentPreview.textContent = project.content || 'No content available';
  reviewContent.appendChild(contentPreview);
}

// Handle keyboard shortcuts for review mode
function handleReviewKeydown(event) {
  if (!isReviewMode || !currentReviewProject) {
    return;
  }
  
  console.log('Review keydown:', event.key);
  
  // Process keyboard shortcuts only when not in a text input
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }
  
  switch (event.key.toLowerCase()) {
    case 'y': // Yes - keep project active
      console.log('Keep project active');
      updateProjectStatus(currentReviewProject, { targetStatus: 'active' })
        .then(success => {
          if (success) {
            showNotification('Project kept active', 'success');
            currentReviewIndex++;
            moveToNextReviewProject();
          }
        });
      break;
      
    case 'a': // Archive project
      console.log('Archive project');
      updateProjectStatus(currentReviewProject, { targetStatus: 'archive' })
        .then(success => {
          if (success) {
            showNotification('Project archived', 'success');
            currentReviewIndex++;
            moveToNextReviewProject();
          }
        });
      break;
      
    case 's': // Move to someday
      console.log('Move to someday');
      updateProjectStatus(currentReviewProject, { targetStatus: 'someday' })
        .then(success => {
          if (success) {
            showNotification('Project moved to someday', 'success');
            currentReviewIndex++;
            moveToNextReviewProject();
          }
        });
      break;
      
    case 'w': // Move to waiting
      console.log('Move to waiting');
      showWaitingInputDialog();
      break;
      
    case 'escape': // End review mode
      console.log('End review mode');
      endReviewMode();
      break;
      
    case 'n': // Next project
      console.log('Next project');
      moveToNextReviewProject();
      break;
  }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  console.log('Keyboard shortcuts set up');
  
  // Remove any existing event listener to prevent duplicates
  document.removeEventListener('keydown', handleReviewKeydown);
  
  // Add the event listener
  document.addEventListener('keydown', handleReviewKeydown);
}

// Setup event listeners for buttons and other UI elements
async function setupEventListeners() {
  console.log('Setting up event listeners');
  
  // Get tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Get refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadProjects();
      showNotification('Projects refreshed', 'success');
    });
  }
  
  // Get report button
  const reportBtn = document.getElementById('report-btn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      switchTab('report');
      generateReport();
    });
  }
  
  // Get start review button
  const startReviewBtn = document.getElementById('start-review-btn');
  if (startReviewBtn) {
    console.log('Adding event listener to Start Review button');
    startReviewBtn.addEventListener('click', async () => {
      console.log('Start Review button clicked');
      await startProjectReview();
    });
  } else {
    console.error('Start Review button not found');
  }
  
  // Get next review button
  const nextReviewBtn = document.getElementById('next-review-btn');
  if (nextReviewBtn) {
    console.log('Adding event listener to Next Review button');
    nextReviewBtn.addEventListener('click', () => {
      moveToNextReviewProject();
    });
  } else {
    console.error('Next Review button not found');
  }
  
  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
}

// Initialize UI elements
async function initializeUI() {
  if (isInitialized) {
    console.log('UI already initialized, skipping');
    return;
  }
  
  console.log('Initializing UI elements');
  
  // Get tab elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Add click event to tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
  
  // Get refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadProjects();
      showNotification('Projects refreshed', 'success');
    });
  }
  
  // Get report button
  const reportBtn = document.getElementById('report-btn');
  if (reportBtn) {
    reportBtn.addEventListener('click', () => {
      switchTab('report');
      generateReport();
    });
  }
  
  // Initialize review elements
  reviewProjectTitle = document.getElementById('review-project-title');
  reviewProjectContent = document.getElementById('review-project-content');
  reviewCount = document.getElementById('review-count');
  reviewTotal = document.getElementById('review-total');
  startReviewBtn = document.getElementById('start-review-btn');
  nextReviewBtn = document.getElementById('next-review-btn');
  
  // Log review elements for debugging
  console.log('Review elements initialized:', {
    reviewProjectTitle: reviewProjectTitle ? true : false,
    reviewProjectContent: reviewProjectContent ? true : false,
    reviewCount: reviewCount ? true : false,
    reviewTotal: reviewTotal ? true : false,
    startReviewBtn: startReviewBtn ? true : false,
    nextReviewBtn: nextReviewBtn ? true : false
  });
  
  // Initialize waiting input dialog elements
  waitingInputGroup = document.getElementById('waiting-dialog');
  
  // Initialize modal elements
  const projectModal = document.getElementById('project-modal');
  const closeModalBtn = document.querySelector('.close');
  
  if (closeModalBtn && projectModal) {
    closeModalBtn.addEventListener('click', () => {
      projectModal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === projectModal && projectModal) {
      projectModal.style.display = 'none';
    }
    
    if (event.target === waitingInputGroup && waitingInputGroup) {
      waitingInputGroup.style.display = 'none';
    }
  });
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up keyboard shortcuts
  setupKeyboardShortcuts();
  
  isInitialized = true;
}

// Setup tabs functionality
function setupTabs() {
  if (!tabBtns) return;
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
}

// Switch to a different tab
function switchTab(tabName) {
  console.log(`Switching to ${tabName} tab`);
  
  // Get all tab buttons and panes
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Hide all tab panes
  tabPanes.forEach(pane => {
    pane.style.display = 'none';
  });
  
  // Remove active class from all tab buttons
  tabButtons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Show the selected tab pane
  const selectedPane = document.getElementById(`${tabName}-tab`);
  if (selectedPane) {
    selectedPane.style.display = 'block';
  } else {
    console.error(`Tab pane ${tabName}-tab not found`);
  }
  
  // Add active class to the selected tab button
  const selectedButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  } else {
    console.error(`Tab button for ${tabName} not found`);
  }
  
  // If switching to review tab, ensure review elements are initialized
  if (tabName === 'review') {
    console.log('Initializing review elements');
    reviewProjectTitle = document.getElementById('review-project-title');
    reviewProjectContent = document.getElementById('review-project-content');
    reviewCount = document.getElementById('review-count');
    reviewTotal = document.getElementById('review-total');
    startReviewBtn = document.getElementById('start-review-btn');
    nextReviewBtn = document.getElementById('next-review-btn');
    
    console.log('Review elements after initialization:', {
      reviewProjectTitle: reviewProjectTitle ? true : false,
      reviewProjectContent: reviewProjectContent ? true : false,
      reviewCount: reviewCount ? true : false,
      reviewTotal: reviewTotal ? true : false,
      startReviewBtn: startReviewBtn ? true : false,
      nextReviewBtn: nextReviewBtn ? true : false
    });
  }
  
  console.log(`Switched to ${tabName} tab`);
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded');
  
  // Initialize the application
  initializeApp();
});

// Also initialize immediately in case DOMContentLoaded already fired
if (document.readyState === 'complete') {
  console.log('Document already loaded, initializing immediately');
  setTimeout(() => {
    initializeApp();
  }, 0);
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
  console.log(`Notification: ${message} (${type})`);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Show notification with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Remove after duration
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300); // Allow time for fade-out animation
  }, duration);
}
