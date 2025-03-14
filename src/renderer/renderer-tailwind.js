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

// Initialize the application
function init() {
  try {
    console.log('Initializing application...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Check database connection before loading projects
    checkDatabaseConnection()
      .then(isConnected => {
        if (isConnected) {
          // Load projects from storage
          loadProjects();
        } else {
          showNotification('Database connection failed. Retrying...', 'error');
          // Try to reconnect after a delay
          setTimeout(() => {
            retryDatabaseConnection();
          }, 3000);
        }
      });
    
    // Initialize view toggle
    initViewToggle();
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize tab navigation
    initTabs();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      switchTab(tabId);
    });
  });
  
  // View toggle
  gridViewBtn.addEventListener('click', () => {
    setView('grid');
  });
  
  listViewBtn.addEventListener('click', () => {
    setView('list');
  });
  
  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
  
  // Search - update to auto-filter as you type with debounce
  let searchDebounceTimer;
  
  projectSearch.addEventListener('input', () => {
    // Clear previous timer
    clearTimeout(searchDebounceTimer);
    
    // Set new timer to debounce the search (300ms delay)
    searchDebounceTimer = setTimeout(() => {
      console.log('Search input changed:', projectSearch.value);
      currentFilter.search = projectSearch.value.trim().toLowerCase();
      filterProjects();
    }, 300);
  });
  
  // Keep the click handler for the search button
  searchBtn.addEventListener('click', () => {
    currentFilter.search = projectSearch.value.trim().toLowerCase();
    filterProjects();
  });
  
  // Keep the Enter key handler
  projectSearch.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      currentFilter.search = projectSearch.value.trim().toLowerCase();
      filterProjects();
    }
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
  
  // Buttons
  refreshBtn.addEventListener('click', loadProjects);
  removeDuplicatesBtn.addEventListener('click', removeDuplicates);
  sortProjectsBtn.addEventListener('click', sortProjects);
  formulateProjectsBtn.addEventListener('click', formulateProjects);
  viewReportBtn.addEventListener('click', viewReport);
  
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
  // Update active tab button
  tabButtons.forEach(button => {
    if (button.dataset.tab === tabId) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Update active tab pane
  tabPanes.forEach(pane => {
    if (pane.id === `${tabId}-tab`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
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
        } else if (Array.isArray(data)) {
          console.log(`Total projects: ${data.length}`);
          if (data.length > 0) {
            console.log('Sample project:', data[0]);
          }
        }
        
        projects = data;
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