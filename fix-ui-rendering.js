// fix-ui-rendering.js
// Script to fix the UI rendering issue by modifying the renderer

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Path to the renderer file
const rendererPath = path.join(
  __dirname,
  'src',
  'renderer',
  'renderer-tailwind.js'
);

async function fixUIRendering() {
  console.log('Starting UI rendering fix...');

  try {
    // Read the renderer file
    console.log(`Reading renderer file: ${rendererPath}`);
    const rendererContent = fs.readFileSync(rendererPath, 'utf8');

    // Create a backup of the original file
    const backupPath = `${rendererPath}.backup`;
    console.log(`Creating backup at: ${backupPath}`);
    fs.writeFileSync(backupPath, rendererContent);

    // Check if the loadProjects function needs modification
    if (rendererContent.includes('window.api.getProjects()')) {
      console.log(
        'Found loadProjects function, checking for modifications needed...'
      );

      // Modify the loadProjects function to ensure proper handling of project data
      let updatedContent = rendererContent.replace(
        /window\.api\.getProjects\(\)\s*\.then\(data => {[\s\S]*?projects = data;/m,
        `window.api.getProjects()
      .then(data => {
        console.log('Projects loaded successfully from IPC');
        console.log('Projects data type:', typeof data);
        console.log('Projects data is array:', Array.isArray(data));
        
        if (typeof data === 'object' && !Array.isArray(data)) {
          // Log the number of projects in each status
          for (const [status, statusProjects] of Object.entries(data)) {
            console.log(\`\${status} projects: \${statusProjects ? statusProjects.length : 0}\`);
            if (statusProjects && statusProjects.length > 0) {
              console.log(\`Sample \${status} project:\`, statusProjects[0]);
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
          }`
      );

      // Modify the renderProjects function to ensure proper rendering
      updatedContent = updatedContent.replace(
        /function renderProjects\(\) {[\s\S]*?const projectsContainer = document\.getElementById\('projects-container'\);/m,
        `function renderProjects() {
  console.log('Rendering projects...');
  
  // Get the current tab
  const currentTabId = getCurrentTab();
  console.log('Current tab:', currentTabId);
  
  // Clear existing projects
  const projectsContainer = document.getElementById('projects-container');
  
  // Debug log the projects object
  console.log('Projects object structure:', Object.keys(projects));
  console.log('Projects type:', typeof projects);
  
  // Ensure projects is properly structured
  if (!projects || typeof projects !== 'object') {
    console.error('Projects is not properly structured:', projects);
    showNotification('Error: Projects data is not properly structured', 'error');
    return;
  }
  
  // Clear existing projects
  if (projectsContainer) {
    projectsContainer.innerHTML = '';
  } else {
    console.error('Projects container not found');
    return;
  }`
      );

      // Write the updated content back to the file
      console.log('Writing updated content to renderer file...');
      fs.writeFileSync(rendererPath, updatedContent);

      console.log('UI rendering fix applied successfully!');
      console.log('Please restart the application to see the changes.');
    } else {
      console.log(
        'Could not find the loadProjects function in the renderer file.'
      );
      console.log('Manual inspection and modification may be required.');
    }
  } catch (error) {
    console.error('Error fixing UI rendering:', error);
    process.exit(1);
  }
}

// Run the fix
fixUIRendering();
