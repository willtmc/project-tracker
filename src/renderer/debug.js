// Debug script to help troubleshoot the application
console.log('Debug script loaded');

// Check if window.api exists
console.log('window.api exists:', !!window.api);

// Check if createProjectItem and createNotification functions exist
console.log('createProjectItem exists:', typeof createProjectItem === 'function');
console.log('createNotification exists:', typeof createNotification === 'function');

// Add a global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Add a button to manually load projects
function addDebugControls() {
  const debugContainer = document.createElement('div');
  debugContainer.className = 'fixed bottom-5 left-5 z-50 bg-white dark:bg-secondary-800 p-4 rounded-lg shadow-lg';
  debugContainer.innerHTML = `
    <h3 class="text-lg font-medium mb-2">Debug Controls</h3>
    <div class="flex flex-col gap-2">
      <button id="debug-load-projects" class="btn btn-primary">Load Projects</button>
      <button id="debug-toggle-view" class="btn btn-secondary">Toggle View</button>
      <button id="debug-toggle-theme" class="btn btn-secondary">Toggle Theme</button>
    </div>
  `;
  
  document.body.appendChild(debugContainer);
  
  // Add event listeners
  document.getElementById('debug-load-projects').addEventListener('click', () => {
    console.log('Manual load projects');
    if (window.appFunctions && window.appFunctions.loadProjects) {
      window.appFunctions.loadProjects();
    } else {
      console.error('loadProjects function not available');
    }
  });
  
  document.getElementById('debug-toggle-view').addEventListener('click', () => {
    console.log('Manual toggle view');
    if (window.appFunctions && window.appFunctions.setView) {
      const currentView = localStorage.getItem('projectView') || 'grid';
      window.appFunctions.setView(currentView === 'grid' ? 'list' : 'grid');
    } else {
      console.error('setView function not available');
    }
  });
  
  document.getElementById('debug-toggle-theme').addEventListener('click', () => {
    console.log('Manual toggle theme');
    if (window.appFunctions && window.appFunctions.toggleTheme) {
      window.appFunctions.toggleTheme();
    } else {
      console.error('toggleTheme function not available');
    }
  });
}

// Add debug controls when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, adding debug controls');
  setTimeout(addDebugControls, 1000); // Add a delay to ensure the app has initialized
}); 