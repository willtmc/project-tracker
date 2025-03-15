// Import the project template functions
// const { createProjectItem, createNotification } = require('./project-template-tailwind');
// We'll get these functions from the global scope now

// Add Chart.js script to the document if not already added
if (!window.Chart) {
  const chartScript = document.createElement('script');
  chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  document.head.appendChild(chartScript);
}

// Define the missing functions
function createProjectItem(project, status) {
  const projectItem = document.createElement('div');
  projectItem.className = 'project-item bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 transition-all';
  projectItem.dataset.id = project.id;
  projectItem.dataset.status = status;

  const title = document.createElement('h3');
  title.className = 'text-lg font-semibold mb-2 text-gray-900 dark:text-white';
  title.textContent = project.title;

  const description = document.createElement('p');
  description.className = 'text-sm text-gray-600 dark:text-gray-300 mb-3';
  description.textContent = project.description || 'No description';

  const footer = document.createElement('div');
  footer.className = 'flex justify-between items-center text-xs text-gray-500 dark:text-gray-400';

  const date = document.createElement('span');
  date.textContent = new Date(project.createdAt).toLocaleDateString();

  const actions = document.createElement('div');
  actions.className = 'flex space-x-2';

  const viewBtn = document.createElement('button');
  viewBtn.className = 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300';
  viewBtn.textContent = 'View';
  viewBtn.addEventListener('click', () => openProjectModal(project));

  actions.appendChild(viewBtn);
  footer.appendChild(date);
  footer.appendChild(actions);

  projectItem.appendChild(title);
  projectItem.appendChild(description);
  projectItem.appendChild(footer);

  return projectItem;
}

function createNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type} p-4 mb-4 rounded-lg shadow-md transition-all`;
  
  // Set background color based on type
  if (type === 'success') {
    notification.classList.add('bg-green-100', 'text-green-800', 'dark:bg-green-800', 'dark:text-green-100');
  } else if (type === 'error') {
    notification.classList.add('bg-red-100', 'text-red-800', 'dark:bg-red-800', 'dark:text-red-100');
  } else if (type === 'warning') {
    notification.classList.add('bg-yellow-100', 'text-yellow-800', 'dark:bg-yellow-800', 'dark:text-yellow-100');
  } else {
    notification.classList.add('bg-blue-100', 'text-blue-800', 'dark:bg-blue-800', 'dark:text-blue-100');
  }

  const content = document.createElement('div');
  content.className = 'flex justify-between items-center';

  const messageEl = document.createElement('p');
  messageEl.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });

  content.appendChild(messageEl);
  content.appendChild(closeBtn);
  notification.appendChild(content);

  // Auto-remove after 5 seconds for success and info notifications
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  return notification;
}

// DOM Elements
const projectGrids = {
  active: document.getElementById('active-projects'),
  waiting: document.getElementById('waiting-projects'),
  someday: document.getElementById('someday-projects'),
  archive: document.getElementById('archive-projects'),
};

const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const gridViewBtn = document.getElementById('grid-view-btn');
const listViewBtn = document.getElementById('list-view-btn');
const themeToggle = document.getElementById('theme-toggle');
const projectSearch = document.getElementById('project-search');
const searchBtn = document.getElementById('search-btn');
const filterStatus = document.getElementById('filter-status');
const filterSort = document.getElementById('filter-sort');
const refreshBtn = document.getElementById('refresh-btn');
const removeDuplicatesBtn = document.getElementById('remove-duplicates-btn');
const sortProjectsBtn = document.getElementById('sort-projects-btn');
const formulateProjectsBtn = document.getElementById('formulate-projects-btn');
const viewReportBtn = document.getElementById('view-report-btn');
const notificationContainer = document.getElementById('notification-container');

// Update elements
const checkUpdatesBtn = document.getElementById('check-updates-btn');
const updateModal = document.getElementById('update-modal');
const closeUpdateModalBtn = document.getElementById('close-update-modal-btn');
const updateVersion = document.getElementById('update-version');
const updateNotes = document.getElementById('update-notes');
const downloadUpdateBtn = document.getElementById('download-update-btn');
const skipUpdateBtn = document.getElementById('skip-update-btn');
const downloadProgressBar = document.getElementById('download-progress-bar');
const downloadProgressText = document.getElementById('download-progress-text');
const restartAppBtn = document.getElementById('restart-app-btn');
const restartLaterBtn = document.getElementById('restart-later-btn');
const closeNoUpdateBtn = document.getElementById('close-no-update-btn');
const closeErrorBtn = document.getElementById('close-error-btn');
const updateErrorMessage = document.getElementById('update-error-message');

// Update content containers
const updateAvailableContent = document.getElementById('update-available-content');
const updateDownloadingContent = document.getElementById('update-downloading-content');
const updateDownloadedContent = document.getElementById('update-downloaded-content');
const updateNotAvailableContent = document.getElementById('update-not-available-content');
const updateErrorContent = document.getElementById('update-error-content');

// Project Modal Elements
const projectModal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const projectDetails = document.getElementById('project-details');
const projectActive = document.getElementById('project-active');
const projectWaiting = document.getElementById('project-waiting');
const waitingInput = document.getElementById('waiting-input');
const waitingInputGroup = document.getElementById('waiting-input-group');
const saveProjectBtn = document.getElementById('save-project-btn');
const cancelBtn = document.getElementById('cancel-btn');
const closeModalBtn = projectModal.querySelector('.close');

// Counters
const activeCount = document.getElementById('active-count');
const waitingCount = document.getElementById('waiting-count');
const somedayCount = document.getElementById('someday-count');
const archiveCount = document.getElementById('archive-count');
const completionRate = document.getElementById('completion-rate');

// Global state
let projects = [];
let currentProject = null;
let currentFilter = {
  search: '',
  status: 'all',
  sort: 'modified-desc',
};

// Helper function to safely get DOM elements
function safeGetElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with ID '${id}' not found in DOM`);
  }
  return element;
}

// Duplicate detection elements - will be properly initialized when DOM is loaded
let startDuplicateDetectionBtn;
let duplicateReviewContainer;
let duplicateList;
let mergeDuplicatesBtn;
let skipDuplicateBtn;
let endDuplicateReviewBtn;

// Project review elements
let startReviewBtn;
let nextReviewBtn;
let reviewProjectTitle;
let reviewProjectContent;
let reviewCount;
let reviewTotal;
let duplicatesCount;

// Function to initialize UI elements safely
function initializeUIElements() {
  startDuplicateDetectionBtn = safeGetElement('start-duplicate-detection-btn');
  duplicateReviewContainer = safeGetElement('duplicate-review-container');
  duplicateList = safeGetElement('duplicate-list');
  mergeDuplicatesBtn = safeGetElement('merge-duplicates-btn');
  skipDuplicateBtn = safeGetElement('skip-duplicate-btn');
  endDuplicateReviewBtn = safeGetElement('end-duplicate-review-btn');
  startReviewBtn = safeGetElement('start-review-btn');
  nextReviewBtn = safeGetElement('next-review-btn');
  reviewProjectTitle = safeGetElement('review-project-title');
  reviewProjectContent = safeGetElement('review-project-content');
  reviewCount = safeGetElement('review-count');
  reviewTotal = safeGetElement('review-total');
  duplicatesCount = safeGetElement('duplicates-count');
}

// Global variables for duplicate detection
let duplicateGroups = [];
let currentDuplicateGroupIndex = 0;

// Global variables for project review
let activeProjectsForReview = [];
let currentReviewIndex = 0;
let reviewInProgress = false;

// Initialize the application
function init() {
  try {
    console.log('Initializing application...');

    // Initialize all UI elements - this should be done first
    initializeUIElements();

    // Log all the important HTML elements
    console.log('Important UI elements:');
    console.log(
      '- startDuplicateDetectionBtn:',
      startDuplicateDetectionBtn ? 'Found' : 'Missing'
    );
    console.log(
      '- duplicateReviewContainer:',
      duplicateReviewContainer ? 'Found' : 'Missing'
    );
    console.log('- duplicateList:', duplicateList ? 'Found' : 'Missing');
    console.log(
      '- mergeDuplicatesBtn:',
      mergeDuplicatesBtn ? 'Found' : 'Missing'
    );
    console.log('- skipDuplicateBtn:', skipDuplicateBtn ? 'Found' : 'Missing');
    console.log(
      '- endDuplicateReviewBtn:',
      endDuplicateReviewBtn ? 'Found' : 'Missing'
    );

    // Set up event listeners more safely
    try {
      setupEventListeners();
      console.log('Event listeners set up successfully');
    } catch (listenerError) {
      console.error('Error setting up event listeners:', listenerError);
    }

    // Add a direct click handler to the duplicate detection button - with additional safety
    if (startDuplicateDetectionBtn) {
      console.log('Adding direct click handler to startDuplicateDetectionBtn');
      try {
        const safeStartDuplication = function () {
          console.log('Start Duplicate Detection button clicked directly');
          try {
            startDuplicateDetection();
          } catch (error) {
            console.error('Error in startDuplicateDetection:', error);
            showNotification(
              'Error starting duplicate detection: ' + error.message,
              'error'
            );
          }
        };

        startDuplicateDetectionBtn.addEventListener(
          'click',
          safeStartDuplication
        );
      } catch (btnError) {
        console.error(
          'Error attaching click handler to startDuplicateDetectionBtn:',
          btnError
        );
      }
    } else {
      console.error('startDuplicateDetectionBtn element not found');
    }

    // Add a direct click handler to the duplicates tab button
    const duplicatesTabButton = document.querySelector(
      '.tab-btn[data-tab="duplicates"]'
    );
    if (duplicatesTabButton) {
      console.log('Adding direct click handler to duplicates tab button');
      duplicatesTabButton.addEventListener('click', function () {
        console.log('Duplicates tab button clicked directly');
        try {
          switchTab('duplicates');
        } catch (error) {
          console.error('Error switching to duplicates tab:', error);
        }
      });
    } else {
      console.error('Duplicates tab button not found');
    }

    // Initialize analytics tab functionality
    initAnalytics();

    // Load projects immediately
    console.log('Loading projects on startup...');
    try {
      loadProjects();
    } catch (projectError) {
      console.error('Error loading projects:', projectError);
    }

    // Check database connection in parallel
    checkDatabaseConnection()
      .then(isConnected => {
        if (!isConnected) {
          showNotification('Database connection failed. Retrying...', 'error');
          // Try to reconnect after a delay
          setTimeout(() => {
            retryDatabaseConnection();
          }, 3000);
        }
      })
      .catch(error => {
        console.error('Error checking database connection:', error);
      });

    // Initialize view toggle
    try {
      initViewToggle();
    } catch (viewError) {
      console.error('Error initializing view toggle:', viewError);
    }

    // Initialize theme toggle
    try {
      initThemeToggle();
    } catch (themeError) {
      console.error('Error initializing theme toggle:', themeError);
    }

    // Initialize tab navigation
    try {
      initTabs();
    } catch (tabError) {
      console.error('Error initializing tabs:', tabError);
    }

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    // Attempt to load projects anyway as a fallback
    try {
      loadProjects();
    } catch (fallbackError) {
      console.error('Fallback project loading also failed:', fallbackError);
    }
  }
}

// Set up event listeners
function setupEventListeners() {
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // View toggle
  gridViewBtn.addEventListener('click', () => setView('grid'));
  listViewBtn.addEventListener('click', () => setView('list'));

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Search
  searchBtn.addEventListener('click', () => {
    currentFilter.search = projectSearch.value;
    filterProjects();
  });

  projectSearch.addEventListener('input', () => {
    currentFilter.search = projectSearch.value;
    filterProjects();
  });

  // Filters
  filterStatus.addEventListener('change', () => {
    currentFilter.status = filterStatus.value;
    filterProjects();
  });

  filterSort.addEventListener('change', () => {
    currentFilter.sort = filterSort.value;
    filterProjects();
  });

  // Refresh button
  refreshBtn.addEventListener('click', async () => {
    try {
      // Disable button and show loading state
      refreshBtn.disabled = true;
      const originalButtonContent = refreshBtn.innerHTML;
      refreshBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Synchronizing...
      `;

      // Call synchronization API
      const result = await window.api.synchronizeProjects();

      // Show notification
      const notification = document.getElementById('sync-notification');
      const message = document.getElementById('sync-message');

      if (result.success) {
        notification.classList.remove('bg-red-500');
        notification.classList.add('bg-green-500');
        message.textContent = `Projects synchronized successfully. ${result.syncStatus.databaseProjects} database projects, ${result.syncStatus.filesystemProjects} filesystem projects.`;
      } else {
        notification.classList.remove('bg-green-500');
        notification.classList.add('bg-red-500');
        message.textContent = result.message || 'Error synchronizing projects';
      }

      // Show notification
      notification.classList.remove('hidden');

      // Hide notification after 5 seconds
      setTimeout(() => {
        notification.classList.add('hidden');
      }, 5000);

      // Load projects after synchronization
      await loadProjects();
    } catch (error) {
      console.error('Error synchronizing projects:', error);

      // Show error notification
      const notification = document.getElementById('sync-notification');
      const message = document.getElementById('sync-message');

      notification.classList.remove('bg-green-500');
      notification.classList.add('bg-red-500');
      message.textContent = `Error: ${error.message || 'Unknown error'}`;

      notification.classList.remove('hidden');

      setTimeout(() => {
        notification.classList.add('hidden');
      }, 5000);
    } finally {
      // Reset button
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `Refresh Projects`;
    }
  });

  // Other buttons
  removeDuplicatesBtn.addEventListener('click', removeDuplicates);
  sortProjectsBtn.addEventListener('click', sortProjects);
  formulateProjectsBtn.addEventListener('click', formulateProjects);
  viewReportBtn.addEventListener('click', viewReport);

  // Duplicate detection event listeners - with safety checks
  if (startDuplicateDetectionBtn) {
    startDuplicateDetectionBtn.addEventListener(
      'click',
      startDuplicateDetection
    );
  } else {
    console.error('startDuplicateDetectionBtn not found during event setup');
  }

  if (mergeDuplicatesBtn) {
    mergeDuplicatesBtn.addEventListener('click', mergeDuplicates);
  } else {
    console.error('mergeDuplicatesBtn not found during event setup');
  }

  if (skipDuplicateBtn) {
    console.log('Setting up click handler for skipDuplicateBtn');
    skipDuplicateBtn.addEventListener('click', function(event) {
      console.log('Skip button clicked directly', event);
      skipDuplicate();
    });
  } else {
    console.error('skipDuplicateBtn not found during event setup');
  }

  if (endDuplicateReviewBtn) {
    console.log('Setting up click handler for endDuplicateReviewBtn');
    endDuplicateReviewBtn.addEventListener('click', function(event) {
      console.log('Cancel button clicked directly', event);
      endDuplicateReview();
    });
  } else {
    console.error('endDuplicateReviewBtn not found during event setup');
  }

  // Project review event listeners
  if (startReviewBtn) {
    startReviewBtn.addEventListener('click', startProjectReview);
  } else {
    console.error('startReviewBtn not found during event setup');
  }

  if (nextReviewBtn) {
    nextReviewBtn.addEventListener('click', showNextProject);
  } else {
    console.error('nextReviewBtn not found during event setup');
  }

  // Project modal
  projectWaiting.addEventListener('change', () => {
    waitingInputGroup.classList.toggle('hidden', !projectWaiting.checked);
  });

  saveProjectBtn.addEventListener('click', saveProjectChanges);
  cancelBtn.addEventListener('click', closeProjectModal);
  closeModalBtn.addEventListener('click', closeProjectModal);

  // Close modal when clicking outside
  projectModal.addEventListener('click', e => {
    if (e.target === projectModal) {
      closeProjectModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !projectModal.classList.contains('hidden')) {
      closeProjectModal();
    }

    // Project review keyboard shortcuts
    if (reviewInProgress) {
      handleReviewKeypress(e);
    }
  });

  // Auto-update event listeners
  if (checkUpdatesBtn) {
    checkUpdatesBtn.addEventListener('click', () => {
      checkForUpdates();
    });
  }
  
  if (closeUpdateModalBtn) {
    closeUpdateModalBtn.addEventListener('click', () => {
      updateModal.classList.add('hidden');
    });
  }
  
  if (downloadUpdateBtn) {
    downloadUpdateBtn.addEventListener('click', () => {
      hideAllUpdateContents();
      updateDownloadingContent.classList.remove('hidden');
      // The download will happen automatically in the main process
    });
  }
  
  if (skipUpdateBtn) {
    skipUpdateBtn.addEventListener('click', () => {
      updateModal.classList.add('hidden');
    });
  }
  
  if (restartAppBtn) {
    restartAppBtn.addEventListener('click', () => {
      // Send IPC to main process to restart and install
      window.api.ipcRenderer.send('restart-app');
    });
  }
  
  if (restartLaterBtn) {
    restartLaterBtn.addEventListener('click', () => {
      updateModal.classList.add('hidden');
    });
  }
  
  if (closeNoUpdateBtn) {
    closeNoUpdateBtn.addEventListener('click', () => {
      updateModal.classList.add('hidden');
    });
  }
  
  if (closeErrorBtn) {
    closeErrorBtn.addEventListener('click', () => {
      updateModal.classList.add('hidden');
    });
  }
  
  // Set up auto-update status listener
  setupUpdateStatusListener();
}

// Initialize view toggle
function initViewToggle() {
  const currentView = localStorage.getItem('projectView') || 'grid';
  setView(currentView, false);
}

// Set view (grid or list)
function setView(view, savePreference = true) {
  console.log(`Setting view to: ${view}`);

  // Update buttons
  gridViewBtn.classList.toggle('active', view === 'grid');
  listViewBtn.classList.toggle('active', view === 'list');

  // Update project grids
  Object.values(projectGrids).forEach(grid => {
    if (grid) {
      grid.classList.toggle('list-view', view === 'list');
    }
  });

  // Save preference
  if (savePreference) {
    localStorage.setItem('projectView', view);
  }
}

// Initialize theme toggle
function initThemeToggle() {
  // Check for saved theme preference or prefer-color-scheme
  const savedTheme = localStorage.getItem('theme');

  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Toggle theme between light and dark
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize tabs
function initTabs() {
  // Set initial tab from localStorage or default to 'active'
  const savedTab = localStorage.getItem('currentTab') || 'active';
  switchTab(savedTab);
}

// Switch to a specific tab
function switchTab(tabId) {
  console.log(`Switching to tab: ${tabId}`);

  // Update active tab button
  tabButtons.forEach(button => {
    if (button.dataset.tab === tabId) {
      button.classList.add('active');
      console.log(`Activated tab button for ${tabId}`);
    } else {
      button.classList.remove('active');
    }
  });

  // Update active tab pane
  tabPanes.forEach(pane => {
    console.log(`Checking tab pane: ${pane.id} against ${tabId}-tab`);
    if (pane.id === `${tabId}-tab`) {
      // Show this tab pane
      pane.style.display = 'block';
      console.log(`Activated tab pane: ${pane.id}`);

      // Special handling for duplicates tab
      if (tabId === 'duplicates') {
        console.log(
          'Duplicates tab activated, ensuring UI elements are properly initialized'
        );
        if (duplicateReviewContainer) {
          console.log(
            'duplicateReviewContainer found:',
            duplicateReviewContainer
          );
          // Always hide the duplicate review container when switching to the tab
          // It will only be shown when duplicates are actively being reviewed
          duplicateReviewContainer.style.display = 'none';

          // Also clear any existing duplicate list content
          if (duplicateList) {
            duplicateList.innerHTML = '';
          }

          // Reset global state
          duplicateGroups = [];
          currentDuplicateGroupIndex = 0;
        } else {
          console.error('duplicateReviewContainer not found');
        }
      } else if (tabId === 'review') {
        // Initialize review mode if not already in progress
        if (!reviewInProgress && startReviewBtn) {
          startReviewBtn.classList.remove('hidden');
        }
      } else if (tabId === 'analytics') {
        // Load analytics data when the tab is selected
        loadAnalyticsData();
      }
    } else {
      // Hide all other tab panes
      pane.style.display = 'none';
    }
  });

  // Save current tab to localStorage
  localStorage.setItem('currentTab', tabId);
}

// Get the current active tab
function getCurrentTab() {
  const activeTabButton = document.querySelector('.tab-btn.active');
  return activeTabButton ? activeTabButton.dataset.tab : 'active';
}

// Load projects from storage
async function loadProjects() {
  try {
    console.log('Loading projects...');
    let projects;

    try {
      // Try to get projects from the main process
      projects = await window.api.getProjects();
      
      // Enhanced logging to debug data structure
      console.log('Projects data type:', typeof projects);
      console.log('Is projects an array?', Array.isArray(projects));
      console.log('Projects structure:', JSON.stringify(projects, null, 2));
      
      // Check if we have data and it's in the expected format
      if (!projects) {
        throw new Error('No projects data received');
      }

      // Check if projects is an object with status keys (active, waiting, etc.)
      if (typeof projects === 'object' && !Array.isArray(projects)) {
        console.log('Projects data is an object with status keys');
        console.log('Status keys:', Object.keys(projects));
        
        // Verify we have arrays for each status
        Object.keys(projects).forEach(status => {
          console.log(`${status} projects:`, Array.isArray(projects[status]) ? projects[status].length : 'Not an array');
          
          // Ensure each project in the array has an id
          if (Array.isArray(projects[status])) {
            projects[status].forEach(project => {
              if (!project.id) {
                console.warn(`Project missing ID, using filename as fallback:`, project.filename);
                project.id = project.filename;
              }
            });
          }
        });
        
        // Render projects by status
        renderProjects(projects);
        return;
      } else {
        console.warn('Projects data is not in the expected format');
      }
    } catch (error) {
      console.error('Error loading projects from main process:', error);
      // Fall back to mock data
      projects = getMockProjects();
    }

    // Render projects
    renderProjects(projects);
  } catch (error) {
    console.error('Error in loadProjects:', error);
    showNotification('Failed to load projects. Please try again.', 'error');
  }
}

// Get mock projects for fallback
function getMockProjects() {
  return {
    active: [
      {
        id: '1',
        filename: 'project-tracker.txt',
        title: 'Complete Project Tracker App',
        content:
          'Finish building the Electron-based project tracker application with all planned features.',
        status: 'active',
        lastModified: new Date().toISOString(),
        endState:
          'A fully functional project tracker app with dark mode, grid/list views, and project management features.',
        totalTasks: 5,
        completedTasks: 2,
        completionPercentage: 40,
        tasks: [
          { id: '1-1', title: 'Set up Electron project', completed: true },
          { id: '1-2', title: 'Create basic UI', completed: true },
          { id: '1-3', title: 'Implement dark mode', completed: false },
          { id: '1-4', title: 'Add project CRUD operations', completed: false },
          { id: '1-5', title: 'Implement view toggle', completed: false },
        ],
      },
      {
        id: '2',
        filename: 'learn-tailwind.txt',
        title: 'Learn Tailwind CSS',
        content:
          'Study Tailwind CSS documentation and build sample projects to get comfortable with the utility-first approach.',
        status: 'active',
        lastModified: new Date(Date.now() - 86400000).toISOString(),
        endState:
          'Comfortable using Tailwind CSS for all new projects without needing to reference documentation constantly.',
        totalTasks: 3,
        completedTasks: 2,
        completionPercentage: 66.67,
        tasks: [
          { id: '2-1', title: 'Read documentation', completed: true },
          { id: '2-2', title: 'Complete tutorial', completed: true },
          { id: '2-3', title: 'Build sample project', completed: false },
        ],
      },
    ],
    waiting: [
      {
        id: '3',
        filename: 'research-database.txt',
        title: 'Research Database Options',
        content:
          'Evaluate different database options for storing project data, including SQLite, MongoDB, and simple JSON files.',
        status: 'waiting',
        waitingInput: 'Performance metrics from the team',
        lastModified: new Date(Date.now() - 172800000).toISOString(),
        totalTasks: 5,
        completedTasks: 3,
        completionPercentage: 60,
        tasks: [
          { id: '3-1', title: 'Research SQLite', completed: true },
          { id: '3-2', title: 'Research MongoDB', completed: true },
          { id: '3-3', title: 'Research JSON storage', completed: true },
          { id: '3-4', title: 'Create comparison document', completed: false },
          { id: '3-5', title: 'Make final recommendation', completed: false },
        ],
      },
    ],
    someday: [
      {
        id: '4',
        filename: 'marketing-strategy.txt',
        title: 'Plan Marketing Strategy',
        content:
          'Develop a marketing strategy for the project tracker app, including target audience, messaging, and channels.',
        status: 'someday',
        lastModified: new Date(Date.now() - 259200000).toISOString(),
        totalTasks: 3,
        completedTasks: 0,
        completionPercentage: 0,
        tasks: [
          { id: '4-1', title: 'Define target audience', completed: false },
          { id: '4-2', title: 'Create messaging framework', completed: false },
          { id: '4-3', title: 'Identify marketing channels', completed: false },
        ],
      },
    ],
    archive: [
      {
        id: '5',
        filename: 'old-project.txt',
        title: 'Old Project Idea',
        content: 'This was a project idea that is no longer relevant.',
        status: 'archive',
        lastModified: new Date(Date.now() - 345600000).toISOString(),
        endState: 'Project was archived due to changing priorities.',
        totalTasks: 2,
        completedTasks: 1,
        completionPercentage: 50,
        tasks: [
          { id: '5-1', title: 'Initial research', completed: true },
          { id: '5-2', title: 'Create project plan', completed: false },
        ],
      },
    ],
  };
}

// Render projects to their respective tabs
function renderProjects(projectsData) {
  console.log('Rendering projects...');

  // Clear existing projects
  clearProjectContainers();

  // If no projects data, show empty state
  if (!projectsData) {
    console.warn('No projects data to render');
    showEmptyState();
    return;
  }

  // Track counts for each status
  const counts = {
    active: 0,
    waiting: 0,
    someday: 0,
    archive: 0,
  };

  // Check if projectsData is an object with status keys
  if (typeof projectsData === 'object' && !Array.isArray(projectsData)) {
    console.log('Rendering projects from categorized data structure');
    
    // Process each status category
    Object.keys(projectsData).forEach(status => {
      if (!Array.isArray(projectsData[status])) {
        console.warn(`Projects for status ${status} is not an array`);
        return;
      }
      
      const projectsForStatus = projectsData[status];
      counts[status] = projectsForStatus.length;
      
      // Get the container for this status
      const container = getContainerForStatus(status);
      if (!container) {
        console.warn(`No container found for status: ${status}`);
        return;
      }
      
      // Render each project in this status
      projectsForStatus.forEach(project => {
        try {
          // Ensure project has an ID
          if (!project.id) {
            project.id = project.filename || `project-${Math.random().toString(36).substr(2, 9)}`;
          }
          
          // Create and append project item
          const projectItem = createProjectItem(project);
          container.appendChild(projectItem);
        } catch (error) {
          console.error(`Error rendering project:`, project, error);
        }
      });
    });
  } else {
    console.warn('Projects data is not in the expected format, falling back to legacy format');
    // Legacy format handling if needed
  }

  // Update counters with the current counts
  updateCounters(counts);

  // Show empty state if no projects were rendered
  const totalProjects = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (totalProjects === 0) {
    showEmptyState();
  }
}

// Helper function to get the appropriate container for a status
function getContainerForStatus(status) {
  switch (status) {
    case 'active':
      return document.getElementById('active-projects-container');
    case 'waiting':
      return document.getElementById('waiting-projects-container');
    case 'someday':
      return document.getElementById('someday-projects-container');
    case 'archive':
      return document.getElementById('archive-projects-container');
    default:
      console.warn(`Unknown status: ${status}`);
      return null;
  }
}

// Helper function to show empty state
function showEmptyState() {
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.classList.remove('hidden');
  }
}

// Helper function to clear all project containers
function clearProjectContainers() {
  const containers = [
    'active-projects-container',
    'waiting-projects-container',
    'someday-projects-container',
    'archive-projects-container'
  ];
  
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = '';
    }
  });
  
  // Hide empty state
  const emptyState = document.getElementById('empty-state');
  if (emptyState) {
    emptyState.classList.add('hidden');
  }
}

// Filter and sort projects based on current filter
function filterAndSortProjects() {
  let result = [...projects];

  // Apply search filter - enhanced to search across more fields
  if (currentFilter.search) {
    const searchTerm = currentFilter.search.toLowerCase();
    result = result.filter(project => {
      // Check various fields for the search term
      return (
        // Title search
        (project.title && project.title.toLowerCase().includes(searchTerm)) ||
        // Content search
        (project.content &&
          project.content.toLowerCase().includes(searchTerm)) ||
        // End state search
        (project.endState &&
          project.endState.toLowerCase().includes(searchTerm)) ||
        // Waiting input search
        (project.waitingInput &&
          project.waitingInput.toLowerCase().includes(searchTerm)) ||
        // Filename search
        (project.filename &&
          project.filename.toLowerCase().includes(searchTerm)) ||
        // Task content search (if tasks are available)
        (project.tasks &&
          Array.isArray(project.tasks) &&
          project.tasks.some(
            task => task.title && task.title.toLowerCase().includes(searchTerm)
          ))
      );
    });
  }

  // Apply status filter
  if (currentFilter.status !== 'all') {
    const isWellFormulated = currentFilter.status === 'well-formulated';
    result = result.filter(project => {
      const hasEndState = project.endState && project.endState.trim() !== '';
      return isWellFormulated ? hasEndState : !hasEndState;
    });
  }

  // Apply sorting
  result.sort((a, b) => {
    switch (currentFilter.sort) {
      case 'modified-desc':
        return new Date(b.lastModified) - new Date(a.lastModified);
      case 'modified-asc':
        return new Date(a.lastModified) - new Date(b.lastModified);
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'progress-desc':
        return getProjectProgress(b) - getProjectProgress(a);
      case 'progress-asc':
        return getProjectProgress(a) - getProjectProgress(b);
      default:
        return 0;
    }
  });

  return result;
}

// Get project progress percentage
function getProjectProgress(project) {
  if (!project.tasks || project.tasks.length === 0) return 0;
  const completedTasks = project.tasks.filter(task => task.completed).length;
  return (completedTasks / project.tasks.length) * 100;
}

// Filter projects based on current filter
function filterProjects() {
  // Show loading indicator if needed
  const searchContainer = document.querySelector('.search-container');
  if (searchContainer) {
    searchContainer.classList.add('searching');

    // Remove the class after rendering is complete
    setTimeout(() => {
      searchContainer.classList.remove('searching');
    }, 300);
  }

  // Render the filtered projects
  renderProjects();

  // Update counters to show how many projects match the filter
  updateCounters();
}

// Update counters
function updateCounters() {
  // Get the current tab
  const currentTabId = getCurrentTab();

  // Get all tabs
  const tabs = ['active', 'waiting', 'someday', 'archive'];

  // Calculate total projects and filtered projects
  let totalProjects = 0;
  let filteredProjects = 0;

  tabs.forEach(tabId => {
    // Get the projects for this tab
    const tabProjects = projects[tabId] || [];
    totalProjects += tabProjects.length;

    // Get the filtered projects for this tab
    const filtered = filterAndSortProjectsForStatus(tabProjects);
    filteredProjects += filtered.length;

    // Update the counter for this tab
    const countElement = document.getElementById(`${tabId}-count`);
    if (countElement) {
      countElement.textContent = filtered.length;
    }
  });

  // Update search results indicator if we're filtering
  if (currentFilter.search) {
    // Create or get the search results indicator
    let resultsIndicator = document.getElementById('search-results-indicator');
    if (!resultsIndicator) {
      resultsIndicator = document.createElement('div');
      resultsIndicator.id = 'search-results-indicator';
      resultsIndicator.className =
        'search-results-indicator text-sm ml-2 text-secondary-600 dark:text-secondary-400';

      // Insert after the search container
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && searchContainer.parentNode) {
        searchContainer.parentNode.insertBefore(
          resultsIndicator,
          searchContainer.nextSibling
        );
      }
    }

    // Update the text
    resultsIndicator.textContent = `Found ${filteredProjects} of ${totalProjects} projects`;
    resultsIndicator.style.display = 'block';
  } else {
    // Hide the indicator if we're not searching
    const resultsIndicator = document.getElementById(
      'search-results-indicator'
    );
    if (resultsIndicator) {
      resultsIndicator.style.display = 'none';
    }
  }
}

// Open project modal
function openProjectModal(project) {
  currentProject = project;

  modalTitle.textContent = project.title;
  projectDetails.textContent = project.content || 'No content';

  projectActive.checked = project.status === 'active';
  projectWaiting.checked = project.status === 'waiting';
  waitingInput.value = project.waitingFor || '';
  waitingInputGroup.classList.toggle('hidden', !projectWaiting.checked);

  projectModal.classList.remove('hidden');
}

// Close project modal
function closeProjectModal() {
  projectModal.classList.add('hidden');
  currentProject = null;
}

// Save project changes
function saveProjectChanges() {
  if (!currentProject) return;

  console.log('Saving project changes...');

  try {
    const updatedProject = {
      path: currentProject.path,
      isActive: projectActive.checked,
      isWaiting: projectWaiting.checked,
      waitingInput: waitingInput.value,
      targetStatus: projectActive.checked
        ? 'active'
        : projectWaiting.checked
          ? 'waiting'
          : currentProject.status,
    };

    console.log('Updated project:', updatedProject);

    // Use the IPC API to save the project
    window.api
      .updateProjectStatus(updatedProject)
      .then(result => {
        console.log('Save result:', result);

        if (result.success) {
          showNotification('Project updated successfully', 'success');
          closeProjectModal();
          loadProjects(); // Reload projects to reflect changes
        } else {
          showNotification(
            `Failed to update project: ${result.message}`,
            'error'
          );
        }
      })
      .catch(error => {
        console.error('Error saving project:', error);
        showNotification('Error saving project', 'error');
      });
  } catch (error) {
    console.error('Error in saveProjectChanges:', error);
    showNotification('Error saving project changes', 'error');
  }
}

// Archive a project
function archiveProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  project.status = 'archive';
  project.lastModified = new Date().toISOString();

  window.api
    .saveProject(project)
    .then(() => {
      renderProjects();
      updateCounters();
      showNotification('Project archived', 'success');
    })
    .catch(error => {
      console.error('Error archiving project:', error);
      showNotification('Failed to archive project', 'error');
    });
}

// Restore a project from archive
function restoreProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  project.status = 'active';
  project.lastModified = new Date().toISOString();

  window.api
    .saveProject(project)
    .then(() => {
      renderProjects();
      updateCounters();
      showNotification('Project restored', 'success');
    })
    .catch(error => {
      console.error('Error restoring project:', error);
      showNotification('Failed to restore project', 'error');
    });
}

// Move a project to waiting
function moveToWaiting(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  // Open modal to get waiting input
  openProjectModal(project);
  projectActive.checked = false;
  projectWaiting.checked = true;
  waitingInputGroup.classList.remove('hidden');
  waitingInput.focus();
}

// Remove duplicate projects
function removeDuplicates() {
  console.log('Removing duplicates...');

  window.api
    .findPotentialDuplicates()
    .then(result => {
      console.log('Find duplicates result:', result);

      if (result.success) {
        showNotification('Duplicate detection completed', 'success');
        loadProjects(); // Reload projects to reflect changes
      } else {
        showNotification(
          `Failed to detect duplicates: ${result.message}`,
          'error'
        );
      }
    })
    .catch(error => {
      console.error('Error removing duplicates:', error);
      showNotification('Error removing duplicates', 'error');
    });
}

// Sort projects
function sortProjects() {
  console.log('Sorting projects...');

  // This is a client-side operation, just re-render with current sort
  renderProjects();
  showNotification('Projects sorted', 'success');
}

// Formulate projects
function formulateProjects() {
  console.log('Formulating projects...');

  if (!currentProject) {
    showNotification('No project selected', 'error');
    return;
  }

  window.api
    .reformulateProject(currentProject.path, currentProject.endState)
    .then(result => {
      console.log('Formulate result:', result);

      if (result.success) {
        showNotification('Project reformulated successfully', 'success');
        closeProjectModal();
        loadProjects(); // Reload projects to reflect changes
      } else {
        showNotification(
          `Failed to reformulate project: ${result.message}`,
          'error'
        );
      }
    })
    .catch(error => {
      console.error('Error formulating project:', error);
      showNotification('Error formulating project', 'error');
    });
}

// View report
function viewReport() {
  console.log('Viewing report...');

  window.api
    .generateReport()
    .then(result => {
      console.log('Report result:', result);

      if (result.success) {
        // Display the report in a modal or new window
        alert(result.report);
        showNotification('Report generated successfully', 'success');
      } else {
        showNotification(
          `Failed to generate report: ${result.message}`,
          'error'
        );
      }
    })
    .catch(error => {
      console.error('Error generating report:', error);
      showNotification('Error generating report', 'error');
    });
}

// Show notification
function showNotification(message, type = 'info') {
  try {
    console.log(`Notification: ${message} (${type})`);

    // Check if createNotification is available
    if (typeof createNotification !== 'function') {
      console.error('createNotification function is not available');
      // Create a simple notification as fallback
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'X';
      closeBtn.className = 'ml-2';
      closeBtn.addEventListener('click', () => notification.remove());
      notification.appendChild(closeBtn);

      // Auto-remove after 5 seconds
      setTimeout(() => notification.remove(), 5000);

      notificationContainer.appendChild(notification);
      return;
    }

    const notification = createNotification(message, type);
    notificationContainer.appendChild(notification);
  } catch (error) {
    console.error('Error showing notification:', error);
    alert(`${message} (${type})`);
  }
}

// Display an error message to the user
function displayErrorMessage(message) {
  console.error('Error:', message);
  showNotification(message, 'error');
}

// Check database connection
function checkDatabaseConnection() {
  return new Promise(resolve => {
    // Try to load projects as a connection test
    window.api
      .getProjects()
      .then(() => {
        console.log('Database connection successful');
        resolve(true);
      })
      .catch(error => {
        console.error('Database connection failed:', error);
        resolve(false);
      });
  });
}

// Retry database connection
function retryDatabaseConnection() {
  console.log('Retrying database connection...');

  // Try to retry any pending database operations
  if (window.api.retryDatabaseOperation) {
    window.api
      .retryDatabaseOperation()
      .then(result => {
        console.log('Retry result:', result);

        if (result.success) {
          showNotification('Database connection restored', 'success');
          loadProjects();
        } else {
          showNotification(
            'Database connection still failed. Please restart the application.',
            'error'
          );
        }
      })
      .catch(error => {
        console.error('Error retrying database connection:', error);
        showNotification(
          'Failed to reconnect to database. Please restart the application.',
          'error'
        );
      });
  } else {
    // Fallback if retry operation is not available
    checkDatabaseConnection().then(isConnected => {
      if (isConnected) {
        showNotification('Database connection restored', 'success');
        loadProjects();
      } else {
        showNotification(
          'Database connection still failed. Please restart the application.',
          'error'
        );
      }
    });
  }
}

/**
 * Start the duplicate detection process
 */
async function startDuplicateDetection() {
  try {
    console.log('Starting duplicate detection...');

    // Clear any existing duplicate groups
    duplicateGroups = [];
    currentDuplicateGroupIndex = 0;

    // Switch to the duplicates tab
    try {
      switchTab('duplicates');
    } catch (error) {
      console.error('Error switching to duplicates tab:', error);
    }

    // Show loading state
    if (startDuplicateDetectionBtn) {
      showLoading(startDuplicateDetectionBtn);
    }

    // Show notification to user
    showNotification('Searching for potential duplicate projects...', 'info');

    // Call the API to detect duplicates
    try {
      console.log('Calling API to find potential duplicates...');
      
      // First call findPotentialDuplicates
      const result = await window.api.findPotentialDuplicates();
      console.log('Duplicate detection result:', result);

      if (result && result.success) {
        // Now get the projects with potential duplicates
        console.log('Getting projects with potential duplicates...');
        const projectsResult = await window.api.getProjectsWithPotentialDuplicates();
        console.log('Projects with duplicates result:', projectsResult);

        if (
          projectsResult && 
          projectsResult.success && 
          projectsResult.duplicateGroups && 
          Array.isArray(projectsResult.duplicateGroups)
        ) {
          // Store the duplicate groups
          duplicateGroups = projectsResult.duplicateGroups;
          console.log(
            `Found ${duplicateGroups.length} duplicate groups:`,
            duplicateGroups
          );

          // Display the first group
          if (duplicateGroups.length > 0) {
            console.log('Displaying first duplicate group...');
            displayDuplicateGroup(0);
            showNotification(`Found ${duplicateGroups.length} potential duplicate groups`, 'success');
          } else {
            console.log('No duplicate groups found, displaying empty state...');
            displayDuplicateGroup(0); // Will show the empty state
            showNotification('No potential duplicates found', 'info');
          }
        } else {
          console.log('No duplicates found or error in projects result');
          // Show empty state
          duplicateGroups = [];
          displayDuplicateGroup(0);
          const errorMessage = result && result.message ? result.message : 'Unknown error';
          showNotification(`Failed to detect duplicates: ${errorMessage}`, 'error');
        }
      } else {
        console.log('Error in duplicate detection result:', result);
        // Show empty state
        duplicateGroups = [];
        displayDuplicateGroup(0);
        const errorMessage = result && result.message ? result.message : 'Unknown error';
        showNotification(`Failed to detect duplicates: ${errorMessage}`, 'error');
      }

      if (startDuplicateDetectionBtn) {
        hideLoading(startDuplicateDetectionBtn);
      }
    } catch (apiError) {
      console.error('API error in duplicate detection:', apiError);
      showNotification(
        'Error detecting duplicates: ' + apiError.message,
        'error'
      );

      if (startDuplicateDetectionBtn) {
        hideLoading(startDuplicateDetectionBtn);
      }
    }
  } catch (error) {
    console.error('Error in startDuplicateDetection:', error);
    showNotification(
      'Error: ' + error.message,
      'error'
    );

    if (startDuplicateDetectionBtn) {
      hideLoading(startDuplicateDetectionBtn);
    }
  }
}

/**
 * Display a duplicate group for review
 * @param {number} groupIndex - Index of the duplicate group to display
 */
function displayDuplicateGroup(groupIndex) {
  try {
    console.log(`Displaying duplicate group at index ${groupIndex}`);
    console.log(`Accessing group at index ${groupIndex} from ${duplicateGroups ? duplicateGroups.length : 0} groups`);
    console.log('Duplicate groups:', duplicateGroups);

    // Get the action buttons container
    const actionButtons = document.querySelector(
      '#duplicate-review-container .flex.gap-3'
    );

    // Ensure duplicate review container is visible
    if (duplicateReviewContainer) {
      duplicateReviewContainer.style.display = 'block';
    } else {
      console.error('duplicateReviewContainer element not found');
      return;
    }

    // Handle case where duplicateGroups is empty or invalid
    if (
      !duplicateGroups ||
      !Array.isArray(duplicateGroups) ||
      duplicateGroups.length === 0
    ) {
      console.log('No duplicate groups to display or empty array');

      // Clear the duplicate list and show a message
      if (duplicateList) {
        duplicateList.innerHTML = `
          <div class="p-6 text-center">
            <h3 class="text-lg font-medium mb-2">No Duplicate Projects Found</h3>
            <p class="text-secondary-500 dark:text-secondary-400 mb-4">
              No potential duplicate projects were detected in your active projects.
            </p>
            <p class="text-sm">
              This could be because:
              <ul class="list-disc pl-5 mt-2 text-left">
                <li>You don't have enough projects (need at least 2)</li>
                <li>Your project titles are sufficiently different</li>
                <li>The similarity threshold wasn't met</li>
              </ul>
            </p>
          </div>
        `;
        duplicateList.style.display = 'block';
      }

      // Hide the action buttons since there's nothing to merge
      if (actionButtons) {
        actionButtons.style.display = 'none';
      }

      // Hide the group counter since there are no groups
      const groupCounter = document.getElementById('duplicate-group-counter');
      if (groupCounter) {
        groupCounter.style.display = 'none';
      }

      // Hide the merge explanation since there's nothing to merge
      const mergeExplanation = document.getElementById('merge-explanation');
      if (mergeExplanation) {
        mergeExplanation.style.display = 'none';
      }

      return;
    }

    // At this point, we have valid duplicate groups
    
    // Show the group counter
    const groupCounter = document.getElementById('duplicate-group-counter');
    if (groupCounter) {
      groupCounter.textContent = `Group ${groupIndex + 1} of ${duplicateGroups.length}`;
      groupCounter.style.display = 'block';
    }

    // Show the action buttons
    if (actionButtons) {
      actionButtons.style.display = 'flex';
    }

    // Show the merge explanation
    const mergeExplanation = document.getElementById('merge-explanation');
    if (mergeExplanation) {
      mergeExplanation.style.display = 'block';
    }

    // Get the current group
    const currentGroup = duplicateGroups[groupIndex];

    // Validate the current group
    if (!currentGroup || !Array.isArray(currentGroup) || currentGroup.length < 2) {
      console.error(`Invalid group at index ${groupIndex}:`, currentGroup);
      if (duplicateList) {
        duplicateList.innerHTML = `
          <div class="p-6 text-center">
            <h3 class="text-lg font-medium mb-2 text-red-500">Invalid Duplicate Group</h3>
            <p class="text-secondary-500 dark:text-secondary-400 mb-4">
              The duplicate group data is invalid or corrupted.
            </p>
          </div>
        `;
      }
      return;
    }

    console.log(`Group ${groupIndex} contains ${currentGroup.length} projects`);
    currentGroup.forEach((project, idx) => {
      console.log(`  Project ${idx + 1}: ${project.title || 'Untitled'}`);
    });

    console.log('Current group:', currentGroup);

    if (!duplicateList) {
      console.error('duplicateList element not found');
      showNotification('UI Error: Duplicate list element not found', 'error');
      return;
    }

    // Make sure duplicate list is visible
    duplicateList.style.display = 'block';
    try {
      duplicateList.innerHTML = '';
    } catch (clearError) {
      console.error('Error clearing duplicate list:', clearError);
    }

    try {
      // Create header with group info
      const header = document.createElement('div');
      header.className =
        'mb-4 pb-2 border-b border-secondary-200 dark:border-secondary-700';
      header.innerHTML = `
        <h3 class="text-lg font-medium">Group ${groupIndex + 1} of ${duplicateGroups.length}</h3>
        <p class="text-secondary-500 dark:text-secondary-400 mb-4">
          Select projects to merge or skip this group
        </p>
      `;
      duplicateList.appendChild(header);

      // Add explanation about merging
      const mergeExplanation = document.createElement('div');
      mergeExplanation.className =
        'bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4';
      mergeExplanation.innerHTML = `
        <h4 class="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">How Merging Works</h4>
        <p class="text-sm text-blue-800 dark:text-blue-300">
          Merging duplicates will combine tasks and unify project content into a single project. 
          Conflicting fields must be chosen by the user. Only selected projects will be merged.
        </p>
      `;
      duplicateList.appendChild(mergeExplanation);

      // Create project cards for each project in the group
      currentGroup.forEach((project, index) => {
        if (!project) {
          console.error(`Null or undefined project at index ${index}`);
          return; // Skip this project
        }

        console.log(`Creating card for project ${index}:`, project);

        const projectCard = document.createElement('div');
        projectCard.className =
          'project-card mb-4 p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg';

        // Create checkbox for selection
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `project-${groupIndex}-${index}`;
        checkbox.className = 'mr-2 duplicate-project-checkbox';
        checkbox.checked = true; // Default to selected

        // Safely set data attributes
        if (project.id) checkbox.dataset.projectId = project.id;
        if (project.path) checkbox.dataset.projectPath = project.path;

        // Create label with project title
        const label = document.createElement('label');
        label.htmlFor = `project-${groupIndex}-${index}`;
        label.className = 'font-medium cursor-pointer';
        label.textContent = project.title || 'Untitled';

        // Create header with checkbox and title
        const projectHeader = document.createElement('div');
        projectHeader.className = 'flex items-center mb-2';
        projectHeader.appendChild(checkbox);
        projectHeader.appendChild(label);

        // Create end state section (if available)
        if (project.endState) {
          const endStateHeader = document.createElement('div');
          endStateHeader.className =
            'font-semibold text-sm text-green-700 dark:text-green-400 mt-3 mb-1';
          endStateHeader.textContent = 'End State / Goal:';

          const endStateContent = document.createElement('div');
          endStateContent.className =
            'text-sm text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800';
          endStateContent.textContent = project.endState;

          projectCard.appendChild(endStateHeader);
          projectCard.appendChild(endStateContent);
        }

        // Create content preview
        const contentHeader = document.createElement('div');
        contentHeader.className =
          'font-semibold text-sm text-secondary-700 dark:text-secondary-400 mt-3 mb-1';
        contentHeader.textContent = 'Content:';

        const contentPreview = document.createElement('div');
        contentPreview.className =
          'text-sm text-secondary-600 dark:text-secondary-400 mt-1 max-h-[150px] overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded';
        contentPreview.textContent = project.content || 'No content';

        // Create metadata section
        const metadata = document.createElement('div');
        metadata.className =
          'text-xs text-secondary-500 dark:text-secondary-400 mt-2 flex flex-wrap gap-2';
        metadata.innerHTML = `
          <span>Status: ${project.status || 'Unknown'}</span>
          <span>Last Modified: ${project.lastModified ? new Date(project.lastModified).toLocaleString() : 'Unknown'}</span>
        `;

        // Assemble project card
        projectCard.appendChild(projectHeader);
        projectCard.appendChild(contentHeader);
        projectCard.appendChild(contentPreview);
        projectCard.appendChild(metadata);

        duplicateList.appendChild(projectCard);
      });

      // Update merge button state
      const mergeBtn = safeGetElement('merge-duplicates-btn');
      if (mergeBtn) {
        mergeBtn.disabled = false;
      }

      console.log('Finished displaying duplicate group');
    } catch (renderError) {
      console.error('Error rendering duplicate group:', renderError);
      showNotification(
        'Error rendering duplicate group: ' + renderError.message,
        'error'
      );
    }
  } catch (error) {
    console.error('Fatal error in displayDuplicateGroup:', error);
    showNotification(
      'Error displaying duplicate data: ' + error.message,
      'error'
    );
  }
}

/**
 * Skip the current duplicate group
 */
function skipDuplicate() {
  try {
    console.log(
      'Skip button clicked, current index:',
      currentDuplicateGroupIndex
    );

    // Add loading state to the button
    const skipBtn = document.getElementById('skip-duplicate-btn');
    if (skipBtn) {
      showLoading(skipBtn);
      console.log('Added loading state to skip button');
    }

    // Increment the index with a safety check
    currentDuplicateGroupIndex++;
    console.log('New index after incrementing:', currentDuplicateGroupIndex);

    // Check if there are more groups to display
    if (
      duplicateGroups &&
      Array.isArray(duplicateGroups) &&
      currentDuplicateGroupIndex < duplicateGroups.length
    ) {
      console.log(
        `Moving to next group at index ${currentDuplicateGroupIndex} of ${duplicateGroups.length}`
      );

      // Display the next group
      try {
        displayDuplicateGroup(currentDuplicateGroupIndex);
        showNotification('Skipped to next duplicate group', 'info');
        console.log('Successfully displayed next duplicate group');
      } catch (displayError) {
        console.error('Error displaying next group:', displayError);
        showNotification(
          'Error displaying next group: ' + displayError.message,
          'error'
        );
        
        // If there's an error displaying the group, try to move to the next one
        if (currentDuplicateGroupIndex + 1 < duplicateGroups.length) {
          console.log('Attempting to skip to the next group after error');
          currentDuplicateGroupIndex++;
          try {
            displayDuplicateGroup(currentDuplicateGroupIndex);
            console.log('Successfully displayed next group after error');
          } catch (secondError) {
            console.error('Error displaying second group attempt:', secondError);
            endDuplicateReview();
            showNotification('Multiple errors encountered. Review ended.', 'error');
          }
        } else {
          console.log('No more groups to display after error, ending review');
          endDuplicateReview();
        }
      }
    } else {
      console.log('No more duplicate groups to display');
      endDuplicateReview();
      showNotification('All duplicate groups processed', 'success');
    }

    // Reset the button state
    if (skipBtn) {
      hideLoading(skipBtn);
      console.log('Removed loading state from skip button');
    }
  } catch (error) {
    console.error('Error in skipDuplicate function:', error);
    showNotification('Error skipping to next group: ' + error.message, 'error');

    // Reset the button state
    const skipBtn = document.getElementById('skip-duplicate-btn');
    if (skipBtn) {
      hideLoading(skipBtn);
      console.log('Removed loading state from skip button after error');
    }
  }
}

/**
 * Merge selected duplicate projects
 */
async function mergeDuplicates() {
  try {
    const selectedCheckboxes = document.querySelectorAll(
      '.duplicate-project-checkbox:checked'
    );
    console.log('Selected checkboxes:', selectedCheckboxes.length);

    if (selectedCheckboxes.length < 2) {
      showNotification('Please select at least 2 projects to merge', 'warning');
      return;
    }

    // Try to get the project paths first, fall back to project IDs if not available
    let selectedProjects = Array.from(selectedCheckboxes).map(
      checkbox => checkbox.dataset.projectPath || checkbox.dataset.projectId
    );

    console.log('Selected projects to merge:', selectedProjects);

    if (selectedProjects.length < 2) {
      showNotification(
        'Project identification failed, please try again',
        'error'
      );
      return;
    }

    // Confirm with the user
    if (
      !confirm(
        `Are you sure you want to merge ${selectedProjects.length} projects? This action cannot be undone.`
      )
    ) {
      return;
    }

    showLoading(mergeDuplicatesBtn);

    // Call the IPC method to merge the projects
    const result = await window.api.mergeProjects(selectedProjects);

    console.log('Merge result:', result);

    hideLoading(mergeDuplicatesBtn);

    if (result && result.success) {
      // Move to the next duplicate group
      currentDuplicateGroupIndex++;

      if (currentDuplicateGroupIndex < duplicateGroups.length) {
        displayDuplicateGroup(currentDuplicateGroupIndex);
        showNotification('Projects merged successfully', 'success');
      } else {
        endDuplicateReview();
        showNotification('All duplicate groups processed', 'success');
      }

      // Reload projects to reflect changes
      loadProjects();
    } else {
      const errorMessage =
        result && result.message ? result.message : 'Unknown error';
      showNotification(`Failed to merge projects: ${errorMessage}`, 'error');
    }
  } catch (error) {
    hideLoading(mergeDuplicatesBtn);
    console.error('Error merging duplicates:', error);
    showNotification(`Error merging duplicates: ${error.message}`, 'error');
  }
}

/**
 * End the duplicate review process
 */
function endDuplicateReview() {
  try {
    console.log('Ending duplicate review process');
    
    // Hide the duplicate review container
    if (duplicateReviewContainer) {
      // Remove both the hidden class and set display to none to ensure it's hidden
      duplicateReviewContainer.classList.add('hidden');
      duplicateReviewContainer.style.display = 'none';
      console.log('Duplicate review container hidden');
    } else {
      console.error('duplicateReviewContainer not found');
    }
    
    // Clear the duplicate list
    if (duplicateList) {
      duplicateList.innerHTML = '';
      console.log('Duplicate list cleared');
    } else {
      console.error('duplicateList not found');
    }
    
    // Reset the state
    currentDuplicateGroupIndex = 0;
    duplicateGroups = [];
    console.log('Duplicate review state reset');
    
    showNotification('Duplicate review canceled', 'info');
  } catch (error) {
    console.error('Error in endDuplicateReview function:', error);
    showNotification('Error canceling duplicate review: ' + error.message, 'error');
  }
}

/**
 * Show loading state on a button
 * @param {HTMLElement} button - Button element to show loading state on
 */
function showLoading(button) {
  if (!button) {
    console.error('Cannot show loading: button is null or undefined');
    return;
  }

  try {
    // Store original text for later restoration
    if (!button.dataset.originalText) {
      button.dataset.originalText =
        button.textContent || button.innerText || '';
    }

    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Processing...';
  } catch (error) {
    console.error('Error showing loading state:', error);
  }
}

/**
 * Hide loading state on a button
 * @param {HTMLElement} button - Button element to hide loading state on
 */
function hideLoading(button) {
  if (!button) {
    console.error('Cannot hide loading: button is null or undefined');
    return;
  }

  try {
    button.disabled = false;

    // Try to use stored original text if available
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      return;
    }

    // Fallback to predefined text based on button ID
    switch (button.id) {
      case 'start-duplicate-detection-btn':
        button.textContent = 'Start Duplicate Detection';
        break;
      case 'merge-duplicates-btn':
        button.textContent = 'Merge Projects';
        break;
      case 'skip-duplicate-btn':
        button.textContent = 'Skip';
        break;
      case 'end-duplicate-review-btn':
        button.textContent = 'Cancel';
        break;
      default:
        button.textContent = 'Process';
    }
  } catch (error) {
    console.error('Error hiding loading state:', error);
  }
}

// Function to initialize analytics tab functionality
function initAnalytics() {
  // Get analytics tab elements
  const analyticsTabButtons = document.querySelectorAll('.analytics-tab-btn');
  const analyticsTabContents = document.querySelectorAll('.analytics-tab-content');
  const refreshLogsBtn = document.getElementById('refresh-logs-btn');
  const loadMoreLogsBtn = document.getElementById('load-more-logs-btn');
  const logTypeFilter = document.getElementById('log-type-filter');
  const logLevelFilter = document.getElementById('log-level-filter');

  // Add event listeners for analytics tab buttons
  analyticsTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-analytics-tab');
      
      // Hide all tab contents
      analyticsTabContents.forEach(content => {
        content.classList.add('hidden');
      });
      
      // Deactivate all tab buttons
      analyticsTabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Show the selected tab content
      const tabContent = document.getElementById(`analytics-${tabId}-tab`);
      if (tabContent) {
        tabContent.classList.remove('hidden');
      }
      
      // Activate the selected tab button
      button.classList.add('active');
      
      // Load specific data based on the tab
      if (tabId === 'logs') {
        loadLogs();
      }
    });
  });
  
  // Add event listener for refresh logs button
  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', () => {
      loadLogs(true);
    });
  }
  
  // Add event listener for load more logs button
  if (loadMoreLogsBtn) {
    loadMoreLogsBtn.addEventListener('click', () => {
      const currentCount = document.querySelectorAll('#logs-container .log-entry').length;
      loadLogs(false, currentCount + 50);
    });
  }
  
  // Add event listeners for log filters
  if (logTypeFilter) {
    logTypeFilter.addEventListener('change', () => {
      loadLogs(true);
    });
  }
  
  if (logLevelFilter) {
    logLevelFilter.addEventListener('change', () => {
      loadLogs(true);
    });
  }
}

// Function to load analytics data
async function loadAnalyticsData() {
  try {
    // Show loading state
    document.getElementById('total-projects-count').textContent = '...';
    document.getElementById('actions-count').textContent = '...';
    document.getElementById('status-changes-list').innerHTML = '<div class="text-center text-secondary-500 dark:text-secondary-400 py-8">Loading status changes...</div>';
    
    // Get analytics data from the main process
    const analyticsData = await window.api.getAnalyticsData();
    
    // Update project counts
    const totalProjects = analyticsData.projectCounts.active + 
                          analyticsData.projectCounts.waiting + 
                          analyticsData.projectCounts.someday + 
                          analyticsData.projectCounts.archive;
    
    document.getElementById('total-projects-count').textContent = totalProjects;
    
    // Update actions count
    const totalActions = analyticsData.actionsPerDay.reduce((total, day) => total + day.count, 0);
    document.getElementById('actions-count').textContent = totalActions;
    
    // Create project status chart
    createProjectStatusChart(analyticsData.projectCounts);
    
    // Create activity chart
    createActivityChart(analyticsData.actionsPerDay);
    
    // Render status changes
    renderStatusChanges(analyticsData.statusChanges);
    
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showNotification('Error loading analytics data: ' + error.message, 'error');
  }
}

// Function to create project status chart
function createProjectStatusChart(projectCounts) {
  const ctx = document.getElementById('project-status-chart').getContext('2d');
  
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not available. Unable to create project status chart.');
    return;
  }
  
  // Clear any existing chart
  if (window.projectStatusChart) {
    window.projectStatusChart.destroy();
  }
  
  // Create the chart
  window.projectStatusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Waiting', 'Someday', 'Archive'],
      datasets: [{
        data: [
          projectCounts.active,
          projectCounts.waiting,
          projectCounts.someday,
          projectCounts.archive
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',  // blue
          'rgba(245, 158, 11, 0.7)',   // amber
          'rgba(16, 185, 129, 0.7)',   // green
          'rgba(107, 114, 128, 0.7)'   // gray
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Function to create activity chart
function createActivityChart(actionsPerDay) {
  const ctx = document.getElementById('activity-chart').getContext('2d');
  
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not available. Unable to create activity chart.');
    return;
  }
  
  // Clear any existing chart
  if (window.activityChart) {
    window.activityChart.destroy();
  }
  
  // Format data for chart
  const labels = [];
  const data = [];
  
  // Sort by date
  actionsPerDay.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Get last 14 days
  const today = new Date();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(today.getDate() - 14);
  
  // Create array of all dates in the last 14 days
  const allDates = [];
  for (let d = new Date(twoWeeksAgo); d <= today; d.setDate(d.getDate() + 1)) {
    allDates.push(new Date(d).toISOString().split('T')[0]);
  }
  
  // Map actions to dates
  const actionsByDate = {};
  actionsPerDay.forEach(day => {
    actionsByDate[day.date] = day.count;
  });
  
  // Fill in the data for all dates
  allDates.forEach(date => {
    labels.push(formatDate(date));
    data.push(actionsByDate[date] || 0);
  });
  
  // Create the chart
  window.activityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Actions',
        data: data,
        borderColor: 'rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
  
  // Helper function to format date as 'MM/DD'
  function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

// Function to render status changes
function renderStatusChanges(statusChanges) {
  const container = document.getElementById('status-changes-list');
  
  if (!container || !statusChanges || statusChanges.length === 0) {
    container.innerHTML = '<div class="text-center text-secondary-500 dark:text-secondary-400 py-8">No status changes found</div>';
    return;
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Render each status change
  statusChanges.forEach(change => {
    const date = new Date(change.createdAt).toLocaleString();
    const fromStatus = change.details?.fromStatus || 'unknown';
    const toStatus = change.details?.toStatus || 'unknown';
    
    const statusChangeHtml = `
      <div class="p-3 border-b border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800">
        <div class="flex justify-between items-start">
          <span class="font-medium">${change.projectTitle || 'Unknown Project'}</span>
          <span class="text-xs text-secondary-500 dark:text-secondary-400">${date}</span>
        </div>
        <div class="mt-1 text-sm">
          Status changed from <span class="font-medium">${fromStatus}</span> to <span class="font-medium">${toStatus}</span>
        </div>
      </div>
    `;
    
    container.innerHTML += statusChangeHtml;
  });
}

// Function to load logs
async function loadLogs(refresh = false, limit = 100) {
  try {
    const container = document.getElementById('logs-container');
    const logTypeFilter = document.getElementById('log-type-filter');
    const logLevelFilter = document.getElementById('log-level-filter');
    
    if (!container) return;
    
    // Show loading state if refreshing
    if (refresh) {
      container.innerHTML = '<div class="text-center text-secondary-500 dark:text-secondary-400 py-8">Loading logs...</div>';
    }
    
    // Get filter values
    const logType = logTypeFilter ? logTypeFilter.value : 'app';
    const level = logLevelFilter ? logLevelFilter.value : 'all';
    
    // Get logs from the main process
    const logs = await window.api.getLogs({ logType, limit, level });
    
    // Import analytics module
    const analytics = require('./modules/analytics');
    
    // Clear container if refreshing
    if (refresh) {
      container.innerHTML = '';
    }
    
    // Check if logs are empty
    if (!logs || logs.length === 0) {
      if (container.innerHTML === '' || refresh) {
        container.innerHTML = '<div class="text-center text-secondary-500 dark:text-secondary-400 py-8">No logs found</div>';
      }
      return;
    }
    
    // Render each log entry
    logs.forEach(log => {
      const logHtml = analytics.formatLogEntry(log);
      container.innerHTML += logHtml;
    });
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('load-more-logs-btn');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = logs.length < limit ? 'none' : 'inline-block';
    }
    
  } catch (error) {
    console.error('Error loading logs:', error);
    const container = document.getElementById('logs-container');
    if (container) {
      container.innerHTML = `<div class="text-center text-secondary-500 dark:text-secondary-400 py-8">Error loading logs: ${error.message}</div>`;
    }
  }
}

// Function to check for updates
function checkForUpdates() {
  showLoading(checkUpdatesBtn);
  
  window.api.checkForUpdates()
    .then(result => {
      hideLoading(checkUpdatesBtn);
      
      if (result.checking) {
        showNotification('Checking for updates...', 'info');
      } else if (result.updateAvailable === false) {
        showUpdateNotAvailable();
      } else if (result.error) {
        showUpdateError(result.message || 'Unknown error occurred');
      }
    })
    .catch(error => {
      hideLoading(checkUpdatesBtn);
      showUpdateError(error.message || 'Failed to check for updates');
    });
}

// Function to set up update status listener
function setupUpdateStatusListener() {
  const removeListener = window.api.onUpdateStatus(status => {
    console.log('Update status received:', status);
    
    switch (status.status) {
      case 'checking':
        showNotification('Checking for updates...', 'info');
        break;
      case 'available':
        showUpdateAvailable(status.version, status.releaseNotes);
        break;
      case 'not-available':
        showUpdateNotAvailable();
        break;
      case 'downloading':
        updateDownloadProgress(status.percent);
        break;
      case 'downloaded':
        showUpdateDownloaded(status.version, status.releaseNotes);
        break;
      case 'error':
        showUpdateError(status.message || 'Unknown error occurred');
        break;
    }
  });
  
  // Clean up the listener when the window is unloaded
  window.addEventListener('unload', () => {
    if (typeof removeListener === 'function') {
      removeListener();
    }
  });
}

// Function to show update available modal
function showUpdateAvailable(version, releaseNotes) {
  hideAllUpdateContents();
  updateVersion.textContent = version || '';
  
  if (releaseNotes) {
    updateNotes.innerHTML = typeof releaseNotes === 'string' 
      ? releaseNotes 
      : 'Release notes not available';
  } else {
    updateNotes.innerHTML = 'No release notes available';
  }
  
  updateAvailableContent.classList.remove('hidden');
  updateModal.classList.remove('hidden');
}

// Function to update download progress
function updateDownloadProgress(percent) {
  if (percent !== undefined && downloadProgressBar && downloadProgressText) {
    const progress = Math.round(percent);
    downloadProgressBar.style.width = `${progress}%`;
    downloadProgressText.textContent = `${progress}%`;
    
    if (!updateModal.classList.contains('hidden')) {
      hideAllUpdateContents();
      updateDownloadingContent.classList.remove('hidden');
    }
  }
}

// Function to show update downloaded modal
function showUpdateDownloaded(version, releaseNotes) {
  hideAllUpdateContents();
  updateDownloadedContent.classList.remove('hidden');
  updateModal.classList.remove('hidden');
  
  // Also show a notification in case the modal is closed
  showNotification(
    'Update downloaded. Restart the application to install.', 
    'success'
  );
}

// Function to show no update available modal
function showUpdateNotAvailable() {
  hideAllUpdateContents();
  updateNotAvailableContent.classList.remove('hidden');
  updateModal.classList.remove('hidden');
}

// Function to show update error modal
function showUpdateError(message) {
  hideAllUpdateContents();
  updateErrorMessage.textContent = message || 'Unknown error';
  updateErrorContent.classList.remove('hidden');
  updateModal.classList.remove('hidden');
}

// Function to hide all update content sections
function hideAllUpdateContents() {
  updateAvailableContent.classList.add('hidden');
  updateDownloadingContent.classList.add('hidden');
  updateDownloadedContent.classList.add('hidden');
  updateNotAvailableContent.classList.add('hidden');
  updateErrorContent.classList.add('hidden');
}

// Expose functions for testing
if (typeof window !== 'undefined') {
  window.appFunctions = {
    loadProjects,
    renderProjects,
    filterProjects,
    sortProjects,
    checkForUpdates,
  };
}

/**
 * Start the project review process
 */
async function startProjectReview() {
  try {
    console.log('Starting project review...');

    // Show loading state
    showLoading(startReviewBtn);

    // Switch to the review tab
    switchTab('review');

    // Get active projects
    const projects = await window.api.getAllProjects();

    if (!projects || !projects.success) {
      console.error(
        'Failed to get projects for review:',
        projects ? projects.message : 'Unknown error'
      );
      showNotification('Failed to load projects for review', 'error');
      hideLoading(startReviewBtn);
      return;
    }

    // Filter for active projects only
    activeProjectsForReview = projects.projects.active || [];
    console.log(
      `Loaded ${activeProjectsForReview.length} active projects for review`
    );

    // Update UI
    if (reviewTotal) reviewTotal.textContent = activeProjectsForReview.length;
    if (reviewCount) reviewCount.textContent = '0';

    // Reset review index
    currentReviewIndex = 0;
    reviewInProgress = true;

    // Update button states
    if (startReviewBtn) startReviewBtn.disabled = true;
    if (nextReviewBtn) nextReviewBtn.disabled = false;

    // Show the first project
    if (activeProjectsForReview.length > 0) {
      showProjectForReview(currentReviewIndex);
      showNotification(
        'Review started. Use keyboard shortcuts (Y/A/S/W) to process projects',
        'info'
      );
    } else {
      if (reviewProjectTitle)
        reviewProjectTitle.textContent = 'No active projects to review';
      if (reviewProjectContent) reviewProjectContent.textContent = '';
      showNotification('No active projects to review', 'info');
      endProjectReview();
    }

    hideLoading(startReviewBtn);
  } catch (error) {
    console.error('Error starting project review:', error);
    showNotification(
      'Error starting project review: ' + (error.message || 'Unknown error'),
      'error'
    );
    hideLoading(startReviewBtn);
  }
}

/**
 * Show a project for review
 * @param {number} index - Index of the project to show
 */
function showProjectForReview(index) {
  try {
    if (!activeProjectsForReview || index >= activeProjectsForReview.length) {
      console.log('No more projects to review');
      endProjectReview();
      return;
    }

    const project = activeProjectsForReview[index];
    console.log(
      `Showing project ${index + 1}/${activeProjectsForReview.length} for review:`,
      project.title
    );

    // Update UI
    if (reviewProjectTitle)
      reviewProjectTitle.textContent = project.title || 'Untitled Project';
    if (reviewProjectContent)
      reviewProjectContent.textContent = project.content || 'No content';
    if (reviewCount) reviewCount.textContent = index + 1;
  } catch (error) {
    console.error('Error showing project for review:', error);
    showNotification(
      'Error showing project: ' + (error.message || 'Unknown error'),
      'error'
    );
  }
}

/**
 * Show the next project for review
 */
function showNextProject() {
  currentReviewIndex++;

  if (currentReviewIndex >= activeProjectsForReview.length) {
    console.log('Review completed');
    showNotification('Review completed!', 'success');
    endProjectReview();
    return;
  }

  showProjectForReview(currentReviewIndex);
}

/**
 * Handle keyboard shortcuts for project review
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleReviewKeypress(event) {
  // Only process if review is in progress and we're on the review tab
  if (!reviewInProgress || getCurrentTab() !== 'review') {
    return;
  }

  const key = event.key.toLowerCase();
  const currentProject = activeProjectsForReview[currentReviewIndex];

  if (!currentProject) {
    return;
  }

  console.log(`Review keypress: ${key}`);

  switch (key) {
    case 'y': // Keep in active
      console.log('Keeping project in active');
      showNotification(
        `Project "${currentProject.title}" kept in Active`,
        'success'
      );
      showNextProject();
      break;

    case 'a': // Archive
      console.log('Archiving project');
      archiveProjectFromReview(currentProject);
      break;

    case 's': // Move to Someday
      console.log('Moving project to Someday');
      moveProjectToSomeday(currentProject);
      break;

    case 'w': // Move to Waiting
      console.log('Moving project to Waiting');
      promptForWaitingInput(currentProject);
      break;
  }
}

/**
 * Archive a project from the review
 * @param {Object} project - Project to archive
 */
async function archiveProjectFromReview(project) {
  try {
    const result = await window.api.updateProjectStatus({
      projectPath: project.path,
      isActive: false,
      isWaiting: false,
      targetStatus: 'archive',
    });

    if (result && result.success) {
      showNotification(`Project "${project.title}" archived`, 'success');
      showNextProject();
    } else {
      console.error(
        'Failed to archive project:',
        result ? result.message : 'Unknown error'
      );
      showNotification('Failed to archive project', 'error');
    }
  } catch (error) {
    console.error('Error archiving project:', error);
    showNotification(
      'Error archiving project: ' + (error.message || 'Unknown error'),
      'error'
    );
  }
}

/**
 * Move a project to the Someday folder
 * @param {Object} project - Project to move
 */
async function moveProjectToSomeday(project) {
  try {
    const result = await window.api.updateProjectStatus({
      projectPath: project.path,
      isActive: false,
      isWaiting: false,
      targetStatus: 'someday',
    });

    if (result && result.success) {
      showNotification(
        `Project "${project.title}" moved to Someday`,
        'success'
      );
      showNextProject();
    } else {
      console.error(
        'Failed to move project to Someday:',
        result ? result.message : 'Unknown error'
      );
      showNotification('Failed to move project to Someday', 'error');
    }
  } catch (error) {
    console.error('Error moving project to Someday:', error);
    showNotification(
      'Error moving project to Someday: ' +
        (error.message || 'Unknown error'),
      'error'
    );
  }
}

/**
 * Prompt for waiting input and move project to Waiting
 * @param {Object} project - Project to move
 */
function promptForWaitingInput(project) {
  // Create a modal dialog to get waiting input
  const modalHTML = `
    <div id="waiting-input-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-secondary-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 class="text-xl font-medium mb-4">What are you waiting for?</h3>
        <p class="mb-4 text-secondary-600 dark:text-secondary-400">Please specify what input or event you're waiting for:</p>
        
        <textarea id="waiting-input-text" class="w-full p-2 border border-secondary-300 dark:border-secondary-700 rounded-md bg-white dark:bg-secondary-900 mb-4" rows="3" placeholder="e.g., Feedback from client, response from vendor, etc."></textarea>
        
        <div class="flex justify-end gap-3">
          <button id="waiting-cancel-btn" class="btn btn-secondary">Cancel</button>
          <button id="waiting-save-btn" class="btn btn-primary">Save & Move</button>
        </div>
      </div>
    </div>
  `;

  // Add the modal to the DOM
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);

  // Get modal elements
  const modal = document.getElementById('waiting-input-modal');
  const inputText = document.getElementById('waiting-input-text');
  const cancelBtn = document.getElementById('waiting-cancel-btn');
  const saveBtn = document.getElementById('waiting-save-btn');

  // Focus the input
  inputText.focus();

  // Add event listeners
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  saveBtn.addEventListener('click', async () => {
    const waitingInput = inputText.value.trim();

    if (!waitingInput) {
      showNotification("Please enter what you're waiting for", 'warning');
      return;
    }

    try {
      const result = await window.api.updateProjectStatus({
        projectPath: project.path,
        isActive: false,
        isWaiting: true,
        waitingInput,
        targetStatus: 'waiting',
      });

      if (result && result.success) {
        showNotification(
          `Project "${project.title}" moved to Waiting`,
          'success'
        );
        document.body.removeChild(modal);
        showNextProject();
      } else {
        console.error(
          'Failed to move project to Waiting:',
          result ? result.message : 'Unknown error'
        );
        showNotification('Failed to move project to Waiting', 'error');
      }
    } catch (error) {
      console.error('Error moving project to Waiting:', error);
      showNotification(
        'Error moving project to Waiting: ' +
          (error.message || 'Unknown error'),
        'error'
      );
    }
  });

  // Handle Escape key to cancel
  inputText.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
    }
  });
}

/**
 * End the project review process
 */
function endProjectReview() {
  reviewInProgress = false;

  // Reset UI
  if (startReviewBtn) startReviewBtn.disabled = false;
  if (nextReviewBtn) nextReviewBtn.disabled = true;

  if (reviewProjectTitle)
    reviewProjectTitle.textContent = 'Select Start to begin review';
  if (reviewProjectContent) reviewProjectContent.textContent = '';

  console.log('Project review ended');
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
