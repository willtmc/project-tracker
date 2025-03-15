// Import the project template functions
// const { createProjectItem, createNotification } = require('./project-template-tailwind');
// We'll get these functions from the global scope now

// DOM Elements
const projectGrids = {
  active: document.getElementById('active-projects'),
  waiting: document.getElementById('waiting-projects'),
  someday: document.getElementById('someday-projects'),
  archive: document.getElementById('archive-projects')
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
  sort: 'modified-desc'
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
    console.log('- startDuplicateDetectionBtn:', startDuplicateDetectionBtn ? 'Found' : 'Missing');
    console.log('- duplicateReviewContainer:', duplicateReviewContainer ? 'Found' : 'Missing');
    console.log('- duplicateList:', duplicateList ? 'Found' : 'Missing');
    console.log('- mergeDuplicatesBtn:', mergeDuplicatesBtn ? 'Found' : 'Missing');
    console.log('- skipDuplicateBtn:', skipDuplicateBtn ? 'Found' : 'Missing');
    console.log('- endDuplicateReviewBtn:', endDuplicateReviewBtn ? 'Found' : 'Missing'); 
    
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
        const safeStartDuplication = function() {
          console.log('Start Duplicate Detection button clicked directly');
          try {
            startDuplicateDetection();
          } catch (error) {
            console.error('Error in startDuplicateDetection:', error);
            showNotification('Error starting duplicate detection: ' + error.message, 'error');
          }
        };
        
        startDuplicateDetectionBtn.addEventListener('click', safeStartDuplication);
      } catch (btnError) {
        console.error('Error attaching click handler to startDuplicateDetectionBtn:', btnError);
      }
    } else {
      console.error('startDuplicateDetectionBtn element not found');
    }
    
    // Add a direct click handler to the duplicates tab button
    const duplicatesTabButton = document.querySelector('.tab-btn[data-tab="duplicates"]');
    if (duplicatesTabButton) {
      console.log('Adding direct click handler to duplicates tab button');
      duplicatesTabButton.addEventListener('click', function() {
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
    startDuplicateDetectionBtn.addEventListener('click', startDuplicateDetection);
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
    skipDuplicateBtn.addEventListener('click', function() {
      console.log('Skip button clicked directly');
      skipDuplicate();
    });
  } else {
    console.error('skipDuplicateBtn not found during event setup');
  }
  
  if (endDuplicateReviewBtn) {
    endDuplicateReviewBtn.addEventListener('click', endDuplicateReview);
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
  projectModal.addEventListener('click', (e) => {
    if (e.target === projectModal) {
      closeProjectModal();
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !projectModal.classList.contains('hidden')) {
      closeProjectModal();
    }
    
    // Project review keyboard shortcuts
    if (reviewInProgress) {
      handleReviewKeypress(e);
    }
  });
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
  
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
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
        console.log('Duplicates tab activated, ensuring UI elements are properly initialized');
        if (duplicateReviewContainer) {
          console.log('duplicateReviewContainer found:', duplicateReviewContainer);
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
function loadProjects() {
  console.log('Loading projects...');
  
  try {
    // Check if window.api exists
    if (!window.api || !window.api.getProjects) {
      console.error('window.api.getProjects is not available. Context isolation might be enabled but preload script is not working correctly.');
      console.log('Falling back to mock data...');
      
      // Use mock data as a fallback
      const mockData = getMockProjects();
      projects = mockData;
      renderProjects();
      updateCounters();
      showNotification('Projects loaded from mock data', 'warning');
      return;
    }
    
    // Always use the IPC API to get projects from the main process
    console.log('Calling window.api.getProjects()...');
    window.api.getProjects()
      .then(data => {
        console.log('Projects loaded successfully from IPC');
        console.log('Projects data type:', typeof data);
        console.log('Projects data is array:', Array.isArray(data));
        
        if (typeof data === 'object' && !Array.isArray(data)) {
          // Log the number of projects in each status
          for (const [status, statusProjects] of Object.entries(data)) {
            console.log(`${status} projects: ${statusProjects ? statusProjects.length : 0}`);
            if (statusProjects && statusProjects.length > 0) {
              console.log(`Sample ${status} project:`, statusProjects[0]);
            }
          }
          
          // Ensure projects is properly structured
          projects = data;
          
          // Force a synchronization if needed
          if (window.api.synchronizeProjects) {
            console.log('Forcing synchronization to ensure UI consistency...');
            window.api.synchronizeProjects().catch(err => {
              console.error('Error during forced synchronization:', err);
            });
          }
        }
        renderProjects();
        updateCounters();
        showNotification('Projects loaded successfully', 'success');
      })
      .catch(error => {
        console.error('Error loading projects:', error);
        showNotification('Failed to load projects', 'error');
        
        // Fall back to mock data on error
        const mockData = getMockProjects();
        projects = mockData;
        renderProjects();
        updateCounters();
        showNotification('Loaded mock data as fallback', 'warning');
      });
  } catch (error) {
    console.error('Error in loadProjects:', error);
    showNotification('Error loading projects', 'error');
    
    // Fall back to mock data on error
    const mockData = getMockProjects();
    projects = mockData;
    renderProjects();
    updateCounters();
    showNotification('Loaded mock data as fallback', 'warning');
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
        content: 'Finish building the Electron-based project tracker application with all planned features.',
        status: 'active',
        lastModified: new Date().toISOString(),
        endState: 'A fully functional project tracker app with dark mode, grid/list views, and project management features.',
        totalTasks: 5,
        completedTasks: 2,
        completionPercentage: 40,
        tasks: [
          { id: '1-1', title: 'Set up Electron project', completed: true },
          { id: '1-2', title: 'Create basic UI', completed: true },
          { id: '1-3', title: 'Implement dark mode', completed: false },
          { id: '1-4', title: 'Add project CRUD operations', completed: false },
          { id: '1-5', title: 'Implement view toggle', completed: false }
        ]
      },
      {
        id: '2',
        filename: 'learn-tailwind.txt',
        title: 'Learn Tailwind CSS',
        content: 'Study Tailwind CSS documentation and build sample projects to get comfortable with the utility-first approach.',
        status: 'active',
        lastModified: new Date(Date.now() - 86400000).toISOString(),
        endState: 'Comfortable using Tailwind CSS for all new projects without needing to reference documentation constantly.',
        totalTasks: 3,
        completedTasks: 2,
        completionPercentage: 66.67,
        tasks: [
          { id: '2-1', title: 'Read documentation', completed: true },
          { id: '2-2', title: 'Complete tutorial', completed: true },
          { id: '2-3', title: 'Build sample project', completed: false }
        ]
      }
    ],
    waiting: [
      {
        id: '3',
        filename: 'research-database.txt',
        title: 'Research Database Options',
        content: 'Evaluate different database options for storing project data, including SQLite, MongoDB, and simple JSON files.',
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
          { id: '3-5', title: 'Make final recommendation', completed: false }
        ]
      }
    ],
    someday: [
      {
        id: '4',
        filename: 'marketing-strategy.txt',
        title: 'Plan Marketing Strategy',
        content: 'Develop a marketing strategy for the project tracker app, including target audience, messaging, and channels.',
        status: 'someday',
        lastModified: new Date(Date.now() - 259200000).toISOString(),
        totalTasks: 3,
        completedTasks: 0,
        completionPercentage: 0,
        tasks: [
          { id: '4-1', title: 'Define target audience', completed: false },
          { id: '4-2', title: 'Create messaging framework', completed: false },
          { id: '4-3', title: 'Identify marketing channels', completed: false }
        ]
      }
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
          { id: '5-2', title: 'Create project plan', completed: false }
        ]
      }
    ]
  };
}

// Render projects to their respective tabs
function renderProjects() {
  console.log('Rendering projects...');
  
  // Clear existing projects
  Object.values(projectGrids).forEach(grid => {
    if (grid) grid.innerHTML = '';
  });
  
  // Check if projects is an object with status keys or an array
  if (projects && typeof projects === 'object' && !Array.isArray(projects)) {
    // Projects is an object with status keys (from ProjectManager)
    console.log('Rendering projects from ProjectManager format');
    
    // Render each group
    Object.entries(projects).forEach(([status, statusProjects]) => {
      const grid = projectGrids[status];
      if (!grid) return;
      
      if (!statusProjects || statusProjects.length === 0) {
        grid.innerHTML = `<div class="text-center p-8 text-secondary-500 dark:text-secondary-400">No projects found</div>`;
        return;
      }
      
      // Filter and sort projects for this status
      const filteredProjects = filterAndSortProjectsForStatus(statusProjects);
      
      // Log the first project to help with debugging
      if (filteredProjects.length > 0) {
        console.log('Sample project:', filteredProjects[0]);
      }
      
      filteredProjects.forEach(project => {
        try {
          // Ensure project has an id for DOM attributes
          if (!project.id) {
            project.id = project.filename || `project-${Math.random().toString(36).substr(2, 9)}`;
          }
          
          // Create project item
          const projectItem = createProjectItem(project, status);
          grid.appendChild(projectItem);
        } catch (error) {
          console.error('Error creating project item:', error, project);
        }
      });
    });
  } else {
    // Projects is an array (from mock data)
    console.log('Rendering projects from array format');
    
    // Filter and sort projects
    const filteredProjects = filterAndSortProjects();
    
    // Group projects by tab
    const groupedProjects = {
      active: filteredProjects.filter(p => p.status === 'active'),
      waiting: filteredProjects.filter(p => p.status === 'waiting'),
      someday: filteredProjects.filter(p => p.status === 'someday'),
      archive: filteredProjects.filter(p => p.status === 'archive')
    };
    
    // Render each group
    Object.entries(groupedProjects).forEach(([tabId, tabProjects]) => {
      const grid = projectGrids[tabId];
      if (!grid) return;
      
      if (tabProjects.length === 0) {
        grid.innerHTML = `<div class="text-center p-8 text-secondary-500 dark:text-secondary-400">No projects found</div>`;
        return;
      }
      
      tabProjects.forEach(project => {
        try {
          // Ensure project has an id for DOM attributes
          if (!project.id) {
            project.id = project.filename || `project-${Math.random().toString(36).substr(2, 9)}`;
          }
          
          // Create project item
          const projectItem = createProjectItem(project, tabId);
          grid.appendChild(projectItem);
        } catch (error) {
          console.error('Error creating project item:', error, project);
        }
      });
    });
  }
}

// Filter and sort projects for a specific status
function filterAndSortProjectsForStatus(statusProjects) {
  if (!statusProjects) return [];
  
  let result = [...statusProjects];
  
  // Apply search filter - enhanced to search across more fields
  if (currentFilter.search) {
    const searchTerm = currentFilter.search.toLowerCase();
    result = result.filter(project => {
      // Check various fields for the search term
      return (
        // Title search
        (project.title && project.title.toLowerCase().includes(searchTerm)) ||
        // Content search
        (project.content && project.content.toLowerCase().includes(searchTerm)) ||
        // End state search
        (project.endState && project.endState.toLowerCase().includes(searchTerm)) ||
        // Waiting input search
        (project.waitingInput && project.waitingInput.toLowerCase().includes(searchTerm)) ||
        // Filename search
        (project.filename && project.filename.toLowerCase().includes(searchTerm)) ||
        // Task content search (if tasks are available)
        (project.tasks && Array.isArray(project.tasks) && project.tasks.some(task => 
          task.title && task.title.toLowerCase().includes(searchTerm)
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
        (project.content && project.content.toLowerCase().includes(searchTerm)) ||
        // End state search
        (project.endState && project.endState.toLowerCase().includes(searchTerm)) ||
        // Waiting input search
        (project.waitingInput && project.waitingInput.toLowerCase().includes(searchTerm)) ||
        // Filename search
        (project.filename && project.filename.toLowerCase().includes(searchTerm)) ||
        // Task content search (if tasks are available)
        (project.tasks && Array.isArray(project.tasks) && project.tasks.some(task => 
          task.title && task.title.toLowerCase().includes(searchTerm)
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
      resultsIndicator.className = 'search-results-indicator text-sm ml-2 text-secondary-600 dark:text-secondary-400';
      
      // Insert after the search container
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && searchContainer.parentNode) {
        searchContainer.parentNode.insertBefore(resultsIndicator, searchContainer.nextSibling);
      }
    }
    
    // Update the text
    resultsIndicator.textContent = `Found ${filteredProjects} of ${totalProjects} projects`;
    resultsIndicator.style.display = 'block';
  } else {
    // Hide the indicator if we're not searching
    const resultsIndicator = document.getElementById('search-results-indicator');
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
      targetStatus: projectActive.checked ? 'active' : (projectWaiting.checked ? 'waiting' : currentProject.status)
    };
    
    console.log('Updated project:', updatedProject);
    
    // Use the IPC API to save the project
    window.api.updateProjectStatus(updatedProject)
      .then(result => {
        console.log('Save result:', result);
        
        if (result.success) {
          showNotification('Project updated successfully', 'success');
          closeProjectModal();
          loadProjects(); // Reload projects to reflect changes
        } else {
          showNotification(`Failed to update project: ${result.message}`, 'error');
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
  
  window.api.saveProject(project)
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
  
  window.api.saveProject(project)
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
  
  window.api.findPotentialDuplicates()
    .then(result => {
      console.log('Find duplicates result:', result);
      
      if (result.success) {
        showNotification('Duplicate detection completed', 'success');
        loadProjects(); // Reload projects to reflect changes
      } else {
        showNotification(`Failed to detect duplicates: ${result.message}`, 'error');
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
  
  window.api.reformulateProject(currentProject.path, currentProject.endState)
    .then(result => {
      console.log('Formulate result:', result);
      
      if (result.success) {
        showNotification('Project reformulated successfully', 'success');
        closeProjectModal();
        loadProjects(); // Reload projects to reflect changes
      } else {
        showNotification(`Failed to reformulate project: ${result.message}`, 'error');
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
  
  window.api.generateReport()
    .then(result => {
      console.log('Report result:', result);
      
      if (result.success) {
        // Display the report in a modal or new window
        alert(result.report);
        showNotification('Report generated successfully', 'success');
      } else {
        showNotification(`Failed to generate report: ${result.message}`, 'error');
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

// Check database connection
function checkDatabaseConnection() {
  return new Promise(resolve => {
    // Try to load projects as a connection test
    window.api.getProjects()
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
    window.api.retryDatabaseOperation()
      .then(result => {
        console.log('Retry result:', result);
        
        if (result.success) {
          showNotification('Database connection restored', 'success');
          loadProjects();
        } else {
          showNotification('Database connection still failed. Please restart the application.', 'error');
        }
      })
      .catch(error => {
        console.error('Error retrying database connection:', error);
        showNotification('Failed to reconnect to database. Please restart the application.', 'error');
      });
  } else {
    // Fallback if retry operation is not available
    checkDatabaseConnection()
      .then(isConnected => {
        if (isConnected) {
          showNotification('Database connection restored', 'success');
          loadProjects();
        } else {
          showNotification('Database connection still failed. Please restart the application.', 'error');
        }
      });
  }
}

/**
 * Start the duplicate detection process
 */
async function startDuplicateDetection() {
  try {
    console.log('Starting duplicate detection process...');
    
    // Ensure we switch to the duplicates tab safely
    try {
      switchTab('duplicates');
    } catch (tabError) {
      console.error('Error switching to duplicates tab:', tabError);
    }
    
    // Show loading state - with null check
    if (startDuplicateDetectionBtn) {
      showLoading(startDuplicateDetectionBtn);
    }
    
    // Show notification to user
    showNotification('Searching for potential duplicate projects...', 'info');
    
    // Check if API is available
    if (!window.api || !window.api.findPotentialDuplicates) {
      console.error('API not available for duplicate detection');
      showNotification('Error: Cannot access duplicate detection functionality', 'error');
      if (startDuplicateDetectionBtn) {
        hideLoading(startDuplicateDetectionBtn);
      }
      return;
    }
    
    // Find potential duplicates
    console.log('Calling window.api.findPotentialDuplicates()...');
    let result;
    try {
      result = await window.api.findPotentialDuplicates();
      console.log('Result from findPotentialDuplicates:', result);
    } catch (apiError) {
      console.error('Error calling findPotentialDuplicates API:', apiError);
      showNotification('API Error in duplicate detection: ' + (apiError.message || 'Unknown error'), 'error');
      if (startDuplicateDetectionBtn) {
        hideLoading(startDuplicateDetectionBtn);
      }
      return;
    }
    
    // Hide loading state - with null check
    if (startDuplicateDetectionBtn) {
      hideLoading(startDuplicateDetectionBtn);
    }
    
    if (result && result.success) {
      // Get projects with potential duplicates
      console.log('Calling window.api.getProjectsWithPotentialDuplicates()...');
      let projectsResult;
      try {
        projectsResult = await window.api.getProjectsWithPotentialDuplicates();
        console.log('Result from getProjectsWithPotentialDuplicates:', projectsResult);
      } catch (projectsError) {
        console.error('Error calling getProjectsWithPotentialDuplicates API:', projectsError);
        showNotification('API Error getting duplicate projects: ' + (projectsError.message || 'Unknown error'), 'error');
        return;
      }
      
      if (projectsResult && projectsResult.success && projectsResult.duplicateGroups && 
          Array.isArray(projectsResult.duplicateGroups) && projectsResult.duplicateGroups.length > 0) {
        
        console.log('Found duplicate groups:', projectsResult.duplicateGroups);
        
        // Ensure each group is an array with at least 2 projects that have title and path
        const validGroups = projectsResult.duplicateGroups.filter(group => 
          Array.isArray(group) && group.length >= 2 && group.every(p => p && typeof p === 'object' && p.title)
        );
        
        console.log(`After validation: ${validGroups.length} valid duplicate groups (out of ${projectsResult.duplicateGroups.length})`);
        duplicateGroups = validGroups;
        
        if (duplicatesCount) {
          duplicatesCount.textContent = duplicateGroups.length;
        } else {
          console.error('duplicatesCount element not found');
        }
        
        // Make sure duplicate review container exists
        if (!duplicateReviewContainer) {
          console.error('Duplicate review container not found');
          showNotification('UI Error: Duplicate review container not found', 'error');
          return;
        }
        
        // Ensure the review container is visible
        if (duplicateReviewContainer) {
          duplicateReviewContainer.style.display = 'block';
        } else {
          console.error('duplicateReviewContainer element not found');
          showNotification('UI Error: Duplicate review container not found', 'error');
          return;
        }
        
        // Extra validation to ensure duplicateGroups is an array and not empty
        if (!duplicateGroups || !Array.isArray(duplicateGroups) || duplicateGroups.length === 0) {
          console.log('No valid duplicate groups found');
          return;
        }
        
        // Show the duplicate review container
        console.log('Showing duplicate review container...');
        
        // Display the first duplicate group or a message if no duplicates were found
        currentDuplicateGroupIndex = 0;
        try {
          displayDuplicateGroup(currentDuplicateGroupIndex);
          
          // Only show success notification if we actually found duplicates
          if (duplicateGroups.length > 0) {
            showNotification(`Found ${duplicateGroups.length} potential duplicate groups`, 'success');
          }
        } catch (displayError) {
          console.error('Error displaying duplicate group:', displayError);
          showNotification('Error showing duplicate groups: ' + (displayError.message || 'Unknown error'), 'error');
          return;
        }
      } else {
        console.log('No duplicate groups found or error in result:', projectsResult);
        if (duplicatesCount) {
          duplicatesCount.textContent = '0';
        }
        
        // Hide duplicate review container if it exists
        if (duplicateReviewContainer) {
          duplicateReviewContainer.style.display = 'none';
        }
        
        // Clear duplicate list if it exists
        if (duplicateList) {
          duplicateList.innerHTML = '';
        }
        
        showNotification('No potential duplicates found', 'info');
      }
    } else {
      const errorMessage = result && result.message ? result.message : 'Unknown error';
      console.error('Failed to detect duplicates:', errorMessage);
      showNotification(`Failed to detect duplicates: ${errorMessage}`, 'error');
    }
  } catch (error) {
    // Hide loading state with null check
    if (startDuplicateDetectionBtn) {
      hideLoading(startDuplicateDetectionBtn);
    }
    console.error('Error starting duplicate detection:', error);
    showNotification('Error starting duplicate detection: ' + (error.message || 'Unknown error'), 'error');
  }
}

/**
 * Display a duplicate group for review
 * @param {number} groupIndex - Index of the duplicate group to display
 */
function displayDuplicateGroup(groupIndex) {
  try {
    console.log(`Displaying duplicate group at index ${groupIndex}`);
    console.log('Duplicate groups array:', duplicateGroups);
    
    if (!duplicateGroups || !Array.isArray(duplicateGroups) || duplicateGroups.length === 0) {
      console.log('No duplicate groups to display or empty array');
      
      // Clear the duplicate list and show a message instead of an error
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
      const actionButtons = document.getElementById('duplicate-action-buttons');
      if (actionButtons) {
        actionButtons.style.display = 'none';
      }
      
      return;
    }
    
    // Ensure we're on the duplicates tab
    try {
      switchTab('duplicates');
    } catch (tabError) {
      console.error('Error switching to duplicates tab:', tabError);
    }
    
    // Safely get the current group
    console.log(`Accessing group at index ${groupIndex} from ${duplicateGroups.length} groups`);
    console.log('Duplicate groups:', duplicateGroups);
    
    // Extra validation to ensure duplicateGroups is an array and not empty
    if (!duplicateGroups || !Array.isArray(duplicateGroups) || duplicateGroups.length === 0) {
      console.error('duplicateGroups is invalid:', duplicateGroups);
      showNotification('Error: Invalid duplicate groups data', 'error');
      return;
    }
    
    // Ensure the index is valid
    if (groupIndex < 0 || groupIndex >= duplicateGroups.length) {
      console.error(`Invalid group index: ${groupIndex}, valid range is 0-${duplicateGroups.length-1}`);
      showNotification('Error: Invalid group index', 'error');
      return;
    }
    
    const group = duplicateGroups[groupIndex];
    if (!group || !Array.isArray(group) || group.length === 0) {
      console.error('Invalid duplicate group:', group);
      showNotification('Error: Invalid duplicate group data', 'error');
      return;
    }
    
    console.log(`Group ${groupIndex} contains ${group.length} projects`);
    group.forEach((project, idx) => {
      console.log(`  Project ${idx+1}: ${project.title || 'Untitled'}`);
    });
    
    console.log('Current group:', group);
    
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
      header.className = 'mb-4 pb-2 border-b border-secondary-200 dark:border-secondary-700';
      header.innerHTML = `
        <h3 class="text-lg font-medium">Group ${groupIndex + 1} of ${duplicateGroups.length}</h3>
        <p class="text-secondary-500 dark:text-secondary-400">Select projects to merge or skip this group</p>
      `;
      duplicateList.appendChild(header);
      
      // Create project cards for each project in the group
      group.forEach((project, index) => {
        if (!project) {
          console.error(`Null or undefined project at index ${index}`);
          return; // Skip this project
        }
        
        console.log(`Creating card for project ${index}:`, project);
        
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card mb-4 p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg';
        
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
          endStateHeader.className = 'font-semibold text-sm text-green-700 dark:text-green-400 mt-3 mb-1';
          endStateHeader.textContent = 'End State / Goal:';
          
          const endStateContent = document.createElement('div');
          endStateContent.className = 'text-sm text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800';
          endStateContent.textContent = project.endState;
          
          projectCard.appendChild(endStateHeader);
          projectCard.appendChild(endStateContent);
        }
        
        // Create content preview
        const contentHeader = document.createElement('div');
        contentHeader.className = 'font-semibold text-sm text-secondary-700 dark:text-secondary-400 mt-3 mb-1';
        contentHeader.textContent = 'Content:';
        
        const contentPreview = document.createElement('div');
        contentPreview.className = 'text-sm text-secondary-600 dark:text-secondary-400 mt-1 max-h-[150px] overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800 rounded';
        contentPreview.textContent = project.content || 'No content';
        
        // Create metadata section
        const metadata = document.createElement('div');
        metadata.className = 'text-xs text-secondary-500 dark:text-secondary-400 mt-2 flex flex-wrap gap-2';
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
      showNotification('Error rendering duplicate group: ' + renderError.message, 'error');
    }
  } catch (error) {
    console.error('Fatal error in displayDuplicateGroup:', error);
    showNotification('Error displaying duplicate data: ' + error.message, 'error');
  }
}

/**
 * Merge selected duplicate projects
 */
async function mergeDuplicates() {
  try {
    const selectedCheckboxes = document.querySelectorAll('.duplicate-project-checkbox:checked');
    console.log('Selected checkboxes:', selectedCheckboxes.length);
    
    if (selectedCheckboxes.length < 2) {
      showNotification('Please select at least 2 projects to merge', 'warning');
      return;
    }
    
    // Try to get the project paths first, fall back to project IDs if not available
    let selectedProjects = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.projectPath || checkbox.dataset.projectId);
    
    console.log('Selected projects to merge:', selectedProjects);
    
    if (selectedProjects.length < 2) {
      showNotification('Project identification failed, please try again', 'error');
      return;
    }
    
    // Confirm with the user
    if (!confirm(`Are you sure you want to merge ${selectedProjects.length} projects? This action cannot be undone.`)) {
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
      const errorMessage = result && result.message ? result.message : 'Unknown error';
      showNotification(`Failed to merge projects: ${errorMessage}`, 'error');
    }
  } catch (error) {
    hideLoading(mergeDuplicatesBtn);
    console.error('Error merging duplicates:', error);
    showNotification(`Error merging duplicates: ${error.message}`, 'error');
  }
}

/**
 * Skip the current duplicate group
 */
function skipDuplicate() {
  try {
    console.log('Skip button clicked, current index:', currentDuplicateGroupIndex);
    
    // Increment the index with a safety check
    currentDuplicateGroupIndex++;
    console.log('New index after incrementing:', currentDuplicateGroupIndex);
    
    // Add loading state to the button
    const skipBtn = document.getElementById('skip-duplicate-btn');
    if (skipBtn) {
      showLoading(skipBtn);
    }
    
    // Check if there are more groups to display
    if (duplicateGroups && Array.isArray(duplicateGroups) && currentDuplicateGroupIndex < duplicateGroups.length) {
      console.log(`Moving to next group at index ${currentDuplicateGroupIndex} of ${duplicateGroups.length}`);
      
      // Display the next group
      try {
        displayDuplicateGroup(currentDuplicateGroupIndex);
        showNotification('Skipped to next duplicate group', 'info');
      } catch(displayError) {
        console.error('Error displaying next group:', displayError);
        showNotification('Error displaying next group: ' + displayError.message, 'error');
      }
    } else {
      console.log('No more duplicate groups to display');
      endDuplicateReview();
      showNotification('All duplicate groups processed', 'success');
    }
    
    // Reset the button state
    if (skipBtn) {
      hideLoading(skipBtn);
    }
  } catch (error) {
    console.error('Error in skipDuplicate function:', error);
    showNotification('Error skipping to next group: ' + error.message, 'error');
    
    // Reset the button state
    const skipBtn = document.getElementById('skip-duplicate-btn');
    if (skipBtn) {
      hideLoading(skipBtn);
    }
  }
}

/**
 * End the duplicate review process
 */
function endDuplicateReview() {
  duplicateReviewContainer.classList.add('hidden');
  duplicateList.innerHTML = '';
  currentDuplicateGroupIndex = 0;
  duplicateGroups = [];
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
      button.dataset.originalText = button.textContent || button.innerText || '';
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

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Expose functions for testing
window.appFunctions = {
  loadProjects,
  filterProjects,
  setView,
  toggleTheme,
  switchTab
};

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
      console.error('Failed to get projects for review:', projects ? projects.message : 'Unknown error');
      showNotification('Failed to load projects for review', 'error');
      hideLoading(startReviewBtn);
      return;
    }
    
    // Filter for active projects only
    activeProjectsForReview = projects.projects.active || [];
    console.log(`Loaded ${activeProjectsForReview.length} active projects for review`);
    
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
      showNotification('Review started. Use keyboard shortcuts (Y/A/S/W) to process projects', 'info');
    } else {
      if (reviewProjectTitle) reviewProjectTitle.textContent = 'No active projects to review';
      if (reviewProjectContent) reviewProjectContent.textContent = '';
      showNotification('No active projects to review', 'info');
      endProjectReview();
    }
    
    hideLoading(startReviewBtn);
  } catch (error) {
    console.error('Error starting project review:', error);
    showNotification('Error starting project review: ' + (error.message || 'Unknown error'), 'error');
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
    console.log(`Showing project ${index + 1}/${activeProjectsForReview.length} for review:`, project.title);
    
    // Update UI
    if (reviewProjectTitle) reviewProjectTitle.textContent = project.title || 'Untitled Project';
    if (reviewProjectContent) reviewProjectContent.textContent = project.content || 'No content';
    if (reviewCount) reviewCount.textContent = index + 1;
  } catch (error) {
    console.error('Error showing project for review:', error);
    showNotification('Error showing project: ' + (error.message || 'Unknown error'), 'error');
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
      showNotification(`Project "${currentProject.title}" kept in Active`, 'success');
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
      targetStatus: 'archive'
    });
    
    if (result && result.success) {
      showNotification(`Project "${project.title}" archived`, 'success');
      showNextProject();
    } else {
      console.error('Failed to archive project:', result ? result.message : 'Unknown error');
      showNotification('Failed to archive project', 'error');
    }
  } catch (error) {
    console.error('Error archiving project:', error);
    showNotification('Error archiving project: ' + (error.message || 'Unknown error'), 'error');
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
      targetStatus: 'someday'
    });
    
    if (result && result.success) {
      showNotification(`Project "${project.title}" moved to Someday`, 'success');
      showNextProject();
    } else {
      console.error('Failed to move project to Someday:', result ? result.message : 'Unknown error');
      showNotification('Failed to move project to Someday', 'error');
    }
  } catch (error) {
    console.error('Error moving project to Someday:', error);
    showNotification('Error moving project to Someday: ' + (error.message || 'Unknown error'), 'error');
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
      showNotification('Please enter what you\'re waiting for', 'warning');
      return;
    }
    
    try {
      const result = await window.api.updateProjectStatus({
        projectPath: project.path,
        isActive: false,
        isWaiting: true,
        waitingInput,
        targetStatus: 'waiting'
      });
      
      if (result && result.success) {
        showNotification(`Project "${project.title}" moved to Waiting`, 'success');
        document.body.removeChild(modal);
        showNextProject();
      } else {
        console.error('Failed to move project to Waiting:', result ? result.message : 'Unknown error');
        showNotification('Failed to move project to Waiting', 'error');
      }
    } catch (error) {
      console.error('Error moving project to Waiting:', error);
      showNotification('Error moving project to Waiting: ' + (error.message || 'Unknown error'), 'error');
    }
  });
  
  // Handle Escape key to cancel
  inputText.addEventListener('keydown', (e) => {
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
  
  if (reviewProjectTitle) reviewProjectTitle.textContent = 'Select Start to begin review';
  if (reviewProjectContent) reviewProjectContent.textContent = '';
  
  console.log('Project review ended');
}