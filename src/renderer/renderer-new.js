// Main renderer process
const { ipcRenderer } = require('electron');
const projectData = require('./modules/projectData');
const tabManager = require('./modules/tabManager');
const uiManager = require('./modules/uiManager');
const reviewManager = require('./modules/reviewManager');
const duplicateDetector = require('./modules/duplicateDetector');
const workflowManager = require('./modules/workflowManager');
const wellFormulationManager = require('./modules/wellFormulationManager');
const events = require('./modules/events');
const utils = require('./modules/utils');
const databaseErrorUI = require('./modules/databaseErrorUI');

/**
 * Initialize the application
 */
async function initialize() {
  console.log('Initializing renderer process...');

  // Initialize UI components
  uiManager.initializeUI();

  // Initialize tab manager
  tabManager.setupTabs();

  // Initialize review manager
  reviewManager.initializeReviewElements();

  // Initialize well-formulation manager
  wellFormulationManager.initializeWellFormulationElements();

  // Initialize workflow manager
  workflowManager.initialize();

  // Initialize database error UI
  databaseErrorUI.initializeDatabaseErrorUI();

  // Set up event listeners
  events.setupEventListeners();
  wellFormulationManager.setupWellFormulationEventListeners();
  setupWorkflowEventListeners();

  // Ensure the active tab is properly displayed
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    const tabId = activeTab.getAttribute('data-tab');
    if (tabId) {
      const tabPane = document.getElementById(`${tabId}-tab`);
      if (tabPane) {
        // Hide all tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('active');
        });
        // Show the active tab pane
        tabPane.classList.add('active');
        console.log('Set active tab to:', tabId);
      }
    }
  }

  // Set up view toggle
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  const themeToggle = document.getElementById('theme-toggle');

  console.log('Grid view button:', gridViewBtn);
  console.log('List view button:', listViewBtn);
  console.log('Theme toggle button:', themeToggle);

  if (gridViewBtn && listViewBtn) {
    // Set initial view from localStorage
    const currentView = localStorage.getItem('projectView') || 'grid';
    console.log('Initial view from localStorage:', currentView);

    // Apply initial view
    const projectGrids = document.querySelectorAll('.projects-grid');
    console.log('Found project grids:', projectGrids.length);

    if (currentView === 'list') {
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      projectGrids.forEach(grid => {
        grid.classList.add('list-view');
        console.log(
          'Added list-view class to grid:',
          grid.id || 'unnamed grid'
        );
      });
    } else {
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
      projectGrids.forEach(grid => {
        grid.classList.remove('list-view');
        console.log(
          'Removed list-view class from grid:',
          grid.id || 'unnamed grid'
        );
      });
    }

    // Set up event listeners
    gridViewBtn.addEventListener('click', () => {
      console.log('Grid view button clicked');
      localStorage.setItem('projectView', 'grid');
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');

      // Get all project grids again to ensure we have the latest
      const allProjectGrids = document.querySelectorAll('.projects-grid');
      console.log(
        'Updating all project grids to grid view:',
        allProjectGrids.length
      );

      allProjectGrids.forEach(grid => {
        console.log(
          'Removing list-view class from grid:',
          grid.id || 'unnamed grid'
        );
        grid.classList.remove('list-view');
      });
    });

    listViewBtn.addEventListener('click', () => {
      console.log('List view button clicked');
      localStorage.setItem('projectView', 'list');
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');

      // Get all project grids again to ensure we have the latest
      const allProjectGrids = document.querySelectorAll('.projects-grid');
      console.log(
        'Updating all project grids to list view:',
        allProjectGrids.length
      );

      allProjectGrids.forEach(grid => {
        console.log(
          'Adding list-view class to grid:',
          grid.id || 'unnamed grid'
        );
        grid.classList.add('list-view');
      });
    });
  } else {
    console.error('View toggle buttons not found');
  }

  // Set up theme toggle
  if (themeToggle) {
    // Set initial theme from localStorage
    const currentTheme = localStorage.getItem('theme') || 'light';
    console.log('Initial theme from localStorage:', currentTheme);

    // Apply initial theme
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-mode');
      console.log('Applied dark mode from localStorage');
    } else {
      document.body.classList.remove('dark-mode');
      console.log('Applied light mode from localStorage');
    }

    // Set up event listener
    themeToggle.addEventListener('click', () => {
      console.log('Theme toggle button clicked');
      const isDarkMode = document.body.classList.toggle('dark-mode');

      if (isDarkMode) {
        localStorage.setItem('theme', 'dark');
        console.log('Switched to dark mode');
      } else {
        localStorage.setItem('theme', 'light');
        console.log('Switched to light mode');
      }
    });
  } else {
    console.error('Theme toggle button not found');
  }

  // Set up search and filter
  setupSearchAndFilter();

  // Load and render projects
  await loadAndRenderProjects();

  // Register IPC handlers
  registerIPCHandlers();

  console.log('Renderer process initialized');
}

/**
 * Load and render projects
 */
async function loadAndRenderProjects() {
  console.log('Loading and rendering projects');

  try {
    // Load projects data
    const projects = await projectData.loadProjects();

    // Process projects for well-formulated status
    processProjectsForWellFormulated(projects);

    // Render projects by category
    renderProjectsByCategory(projects);

    console.log('Projects loaded and rendered');
  } catch (error) {
    console.error('Error loading and rendering projects:', error);
    uiManager.showNotification(
      'Error loading projects: ' + error.message,
      'error'
    );
  }
}

/**
 * Process projects for well-formulated status
 * @param {Object} projects The projects object with categories
 */
function processProjectsForWellFormulated(projects) {
  console.log('Processing projects for well-formulated status');

  if (!projects) return;

  // Process each category
  Object.keys(projects).forEach(category => {
    if (Array.isArray(projects[category])) {
      projects[category].forEach(project => {
        // Check if the project is well-formulated
        project.isWellFormulated = utils.isProjectWellFormulated(project);
      });
    }
  });
}

/**
 * Filter and sort projects
 * @param {Array} projects The projects to filter and sort
 * @param {string} searchTerm The search term to filter by
 * @param {string} statusFilter The status filter to apply
 * @param {string} sortOption The sort option to apply
 * @returns {Array} The filtered and sorted projects
 */
function filterAndSortProjects(projects, searchTerm, statusFilter, sortOption) {
  if (!projects || !Array.isArray(projects)) return [];

  // Filter by search term
  let filteredProjects = projects;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredProjects = projects.filter(project => {
      return (
        (project.title && project.title.toLowerCase().includes(term)) ||
        (project.endState && project.endState.toLowerCase().includes(term)) ||
        (project.waitingInput &&
          project.waitingInput.toLowerCase().includes(term))
      );
    });
  }

  // Filter by status
  if (statusFilter && statusFilter !== 'all') {
    filteredProjects = filteredProjects.filter(project => {
      if (statusFilter === 'well-formulated') {
        return project.isWellFormulated;
      } else if (statusFilter === 'needs-improvement') {
        return !project.isWellFormulated;
      }
      return true;
    });
  }

  // Sort projects
  if (sortOption) {
    filteredProjects.sort((a, b) => {
      switch (sortOption) {
        case 'modified-desc':
          return new Date(b.lastModified) - new Date(a.lastModified);
        case 'modified-asc':
          return new Date(a.lastModified) - new Date(b.lastModified);
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'progress-desc':
          const progressA =
            a.totalTasks > 0 ? a.completedTasks / a.totalTasks : 0;
          const progressB =
            b.totalTasks > 0 ? b.completedTasks / b.totalTasks : 0;
          return progressB - progressA;
        case 'progress-asc':
          const progressAsc =
            a.totalTasks > 0 ? a.completedTasks / a.totalTasks : 0;
          const progressBsc =
            b.totalTasks > 0 ? b.completedTasks / b.totalTasks : 0;
          return progressAsc - progressBsc;
        default:
          return 0;
      }
    });
  }

  return filteredProjects;
}

/**
 * Render projects by category
 * @param {Object} projects The projects object with categories
 */
function renderProjectsByCategory(projects) {
  console.log('Rendering projects by category');

  if (!projects) return;

  // Get project containers
  const activeContainer = document.getElementById('active-projects');
  const waitingContainer = document.getElementById('waiting-projects');
  const somedayContainer = document.getElementById('someday-projects');
  const archiveContainer = document.getElementById('archive-projects');

  // Get filter values
  const searchTerm = document.getElementById('project-search')?.value || '';
  const statusFilter = document.getElementById('filter-status')?.value || 'all';
  const sortOption =
    document.getElementById('filter-sort')?.value || 'modified-desc';

  // Clear containers
  if (activeContainer) activeContainer.innerHTML = '';
  if (waitingContainer) waitingContainer.innerHTML = '';
  if (somedayContainer) somedayContainer.innerHTML = '';
  if (archiveContainer) archiveContainer.innerHTML = '';

  // Render active projects
  if (projects.active && activeContainer) {
    const filteredProjects = filterAndSortProjects(
      projects.active,
      searchTerm,
      statusFilter,
      sortOption
    );
    renderProjectList(filteredProjects, activeContainer, 'active');

    // Update stats
    const activeCountElement = document.getElementById('active-count');
    if (activeCountElement) {
      activeCountElement.textContent = filteredProjects.length;
    }

    // Update completion rate
    const completionRateElement = document.getElementById('completion-rate');
    if (completionRateElement) {
      let totalTasks = 0;
      let completedTasks = 0;

      filteredProjects.forEach(project => {
        totalTasks += project.totalTasks || 0;
        completedTasks += project.completedTasks || 0;
      });

      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      completionRateElement.textContent = `${completionRate}%`;
    }
  }

  // Render waiting projects
  if (projects.waiting && waitingContainer) {
    const filteredProjects = filterAndSortProjects(
      projects.waiting,
      searchTerm,
      statusFilter,
      sortOption
    );
    renderProjectList(filteredProjects, waitingContainer, 'waiting');

    // Update stats
    const waitingCountElement = document.getElementById('waiting-count');
    if (waitingCountElement) {
      waitingCountElement.textContent = filteredProjects.length;
    }
  }

  // Render someday projects
  if (projects.someday && somedayContainer) {
    const filteredProjects = filterAndSortProjects(
      projects.someday,
      searchTerm,
      statusFilter,
      sortOption
    );
    renderProjectList(filteredProjects, somedayContainer, 'someday');

    // Update stats
    const somedayCountElement = document.getElementById('someday-count');
    if (somedayCountElement) {
      somedayCountElement.textContent = filteredProjects.length;
    }
  }

  // Render archive projects
  if (projects.archive && archiveContainer) {
    const filteredProjects = filterAndSortProjects(
      projects.archive,
      searchTerm,
      statusFilter,
      sortOption
    );
    renderProjectList(filteredProjects, archiveContainer, 'archive');

    // Update stats
    const archiveCountElement = document.getElementById('archive-count');
    if (archiveCountElement) {
      archiveCountElement.textContent = filteredProjects.length;
    }
  }
}

/**
 * Render a list of projects
 * @param {Array} projects The list of projects to render
 * @param {HTMLElement} container The container to render projects in
 * @param {string} category The category of projects
 */
function renderProjectList(projects, container, category) {
  if (!projects || !container) return;

  projects.forEach(project => {
    const projectElement = createProjectElement(project, category);
    container.appendChild(projectElement);
  });
}

/**
 * Create a project element
 * @param {Object} project The project to create an element for
 * @param {string} category The category of the project
 * @returns {HTMLElement} The project element
 */
function createProjectElement(project, category) {
  const projectElement = document.createElement('div');
  projectElement.className = `project-item ${project.isWellFormulated ? 'well-formulated' : 'needs-improvement'}`;
  projectElement.dataset.id = project.id;
  projectElement.dataset.path = project.path;
  projectElement.dataset.category = category;

  // Create header with title and status indicator
  const headerElement = document.createElement('div');
  headerElement.className = 'project-header';

  const titleElement = document.createElement('h3');
  titleElement.className = 'project-title';
  titleElement.textContent = project.title || 'Untitled Project';

  // Add status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.className = `status-indicator ${category}`;
  statusIndicator.textContent =
    category.charAt(0).toUpperCase() + category.slice(1);

  headerElement.appendChild(titleElement);
  headerElement.appendChild(statusIndicator);
  projectElement.appendChild(headerElement);

  // Add last modified date
  const lastModifiedElement = document.createElement('div');
  lastModifiedElement.className = 'project-last-modified';
  lastModifiedElement.textContent = `Last modified: ${utils.formatDate(project.lastModified)}`;
  projectElement.appendChild(lastModifiedElement);

  // Add progress bar if there are tasks
  if (project.totalTasks > 0) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';

    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    const progressPercent = Math.round(
      (project.completedTasks / project.totalTasks) * 100
    );
    progressFill.style.width = `${progressPercent}%`;

    progressBar.appendChild(progressFill);
    progressContainer.appendChild(progressBar);

    const progressText = document.createElement('div');
    progressText.className = 'progress-text';
    progressText.textContent = `${project.completedTasks}/${project.totalTasks} tasks completed (${progressPercent}%)`;

    progressContainer.appendChild(progressText);
    projectElement.appendChild(progressContainer);
  }

  // Add end state preview if available
  if (project.endState) {
    const endStateContainer = document.createElement('div');
    endStateContainer.className = 'project-end-state';

    const endStateLabel = document.createElement('div');
    endStateLabel.className = 'end-state-label';
    endStateLabel.textContent = 'End State:';

    const endStateText = document.createElement('div');
    endStateText.className = 'end-state-text';
    // Truncate end state if it's too long
    const truncatedEndState =
      project.endState.length > 100
        ? project.endState.substring(0, 100) + '...'
        : project.endState;
    endStateText.textContent = truncatedEndState;

    endStateContainer.appendChild(endStateLabel);
    endStateContainer.appendChild(endStateText);
    projectElement.appendChild(endStateContainer);
  }

  // Add waiting input if available
  if (project.waitingInput) {
    const waitingBadge = document.createElement('div');
    waitingBadge.className = 'waiting-badge';
    waitingBadge.textContent = `Waiting on: ${project.waitingInput}`;
    projectElement.appendChild(waitingBadge);
  }

  // Add click event to open project modal
  projectElement.addEventListener('click', () => {
    console.log('Project clicked:', project.title);
    const uiManager = require('./modules/uiManager');
    uiManager.openProjectModal(project);
  });

  // Add cursor pointer style to indicate clickability
  projectElement.style.cursor = 'pointer';

  return projectElement;
}

/**
 * Set up workflow-related event listeners
 */
function setupWorkflowEventListeners() {
  console.log('Setting up workflow event listeners');

  // Complete Review button
  const completeReviewBtn = document.getElementById('complete-review-btn');
  if (completeReviewBtn) {
    completeReviewBtn.addEventListener('click', () => {
      console.log('Complete Review button clicked');
      reviewManager.endReview();
    });
  }

  // Complete Well-Formulation button
  const completeWellFormulationBtn = document.getElementById(
    'complete-well-formulation-btn'
  );
  if (completeWellFormulationBtn) {
    completeWellFormulationBtn.addEventListener('click', () => {
      console.log('Complete Well-Formulation button clicked');
      wellFormulationManager.completeWellFormulationCheck();
    });
  }
}

/**
 * Set up search and filter functionality
 */
function setupSearchAndFilter() {
  const searchInput = document.getElementById('project-search');
  const searchBtn = document.getElementById('search-btn');
  const filterStatus = document.getElementById('filter-status');
  const filterSort = document.getElementById('filter-sort');

  // Function to apply filters
  const applyFilters = () => {
    const projects = projectData.getProjectsData();
    if (projects) {
      renderProjectsByCategory(projects);
    }
  };

  // Set up event listeners for search and filter controls
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      // Debounce search input
      clearTimeout(searchInput.debounceTimer);
      searchInput.debounceTimer = setTimeout(() => {
        console.log('Searching for:', searchInput.value);
        applyFilters();
      }, 300);
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      console.log('Search button clicked');
      applyFilters();
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', () => {
      console.log('Status filter changed to:', filterStatus.value);
      applyFilters();
    });
  }

  if (filterSort) {
    filterSort.addEventListener('change', () => {
      console.log('Sort option changed to:', filterSort.value);
      applyFilters();
    });
  }
}

/**
 * Register IPC handlers
 */
function registerIPCHandlers() {
  console.log('Registering IPC handlers');

  // Handle projects-updated event
  ipcRenderer.on('projects-updated', async () => {
    console.log('Received projects-updated event');
    await loadAndRenderProjects();
  });

  // Handle project-saved event
  ipcRenderer.on('project-saved', async (event, projectId) => {
    console.log('Received project-saved event for project:', projectId);
    await loadAndRenderProjects();
  });

  // Handle custom events
  document.addEventListener('projects-updated', async event => {
    console.log('Received custom projects-updated event');
    if (event.detail) {
      // Process and render the provided projects
      processProjectsForWellFormulated(event.detail);
      renderProjectsByCategory(event.detail);
    } else {
      // Reload projects if no detail provided
      await loadAndRenderProjects();
    }
  });

  // Handle database-restored event
  ipcRenderer.on('database-restored', (event, data) => {
    console.log('Database restored:', data);
    uiManager.showNotification(
      data.message || 'Database has been restored',
      'success'
    );

    // Reload projects after database restoration
    loadAndRenderProjects();
  });

  console.log('IPC handlers registered');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initialize();
  setupDebugPanel();
});

/**
 * Set up the debug panel for logging
 */
function setupDebugPanel() {
  try {
    console.log('Setting up debug panel');
    const toggleBtn = document.getElementById('toggle-debug-panel-btn');
    const debugPanel = document.getElementById('debug-panel');
    const debugLog = document.getElementById('debug-log');
    const clearBtn = document.getElementById('clear-debug-log-btn');
    const refreshBtn = document.getElementById('refresh-debug-log-btn');

    if (!toggleBtn || !debugPanel || !debugLog) {
      console.error('Debug panel elements not found');
      return;
    }

    toggleBtn.addEventListener('click', () => {
      if (debugPanel.style.display === 'none') {
        debugPanel.style.display = 'block';
        toggleBtn.textContent = 'Hide Debug Panel';
        refreshDebugLog();
      } else {
        debugPanel.style.display = 'none';
        toggleBtn.textContent = 'Show Debug Panel';
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        debugLog.textContent = 'Debug log cleared.';
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', refreshDebugLog);
    }

    // Auto-refresh debug log every 5 seconds when visible
    setInterval(() => {
      if (debugPanel.style.display !== 'none') {
        refreshDebugLog();
      }
    }, 5000);

    // Function to read log file and display in debug panel
    function refreshDebugLog() {
      try {
        const fs = require('fs');
        const path = require('path');

        // Get app directory
        const appDir = process.cwd();
        const logPath = path.join(appDir, 'renderer-debug.log');

        if (fs.existsSync(logPath)) {
          // Read last 200 lines of log file
          const log = fs.readFileSync(logPath, 'utf8');
          const lines = log.split('\n');
          const lastLines = lines
            .slice(Math.max(0, lines.length - 200))
            .join('\n');

          debugLog.textContent = lastLines;

          // Scroll to bottom
          debugLog.scrollTop = debugLog.scrollHeight;
        } else {
          debugLog.textContent = 'Log file not found: ' + logPath;
        }
      } catch (error) {
        debugLog.textContent = `Error reading log file: ${error.message}`;
        console.error('Error refreshing debug log:', error);
      }
    }

    console.log('Debug panel setup complete');
  } catch (error) {
    console.error('Error setting up debug panel:', error);
  }
}

// Export functions for use in other modules
module.exports = {
  initialize,
  loadAndRenderProjects,
  processProjectsForWellFormulated,
  renderProjectsByCategory,
  setupDebugPanel,
};
