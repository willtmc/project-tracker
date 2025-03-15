const { contextBridge, ipcRenderer } = require('electron');
const { CONFIG } = require('./config');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Expose configuration to renderer process
  config: CONFIG,
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProject: project => ipcRenderer.invoke('save-project', project),
  updateProjectStatus: project =>
    ipcRenderer.invoke('update-project-status', project),
  validateProject: projectPath =>
    ipcRenderer.invoke('validate-project', projectPath),
  reformulateProject: (projectPath, endState) =>
    ipcRenderer.invoke('reformulate-project', projectPath, endState),
  generateReport: () => ipcRenderer.invoke('generate-report'),
  findPotentialDuplicates: () =>
    ipcRenderer.invoke('find-potential-duplicates'),
  mergeDuplicateProjects: projectIds =>
    ipcRenderer.invoke('merge-duplicate-projects', projectIds),
  mergeProjects: projectPaths =>
    ipcRenderer.invoke('merge-projects', projectPaths),
  getProjectsWithPotentialDuplicates: () =>
    ipcRenderer.invoke('get-projects-with-potential-duplicates'),
  retryDatabaseOperation: () => ipcRenderer.invoke('retry-database-operation'),
  synchronizeProjects: () => ipcRenderer.invoke('synchronize-projects'),

  // Auto-update functionality
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Analytics and Logs
  getLogs: options => ipcRenderer.invoke('get-logs', options),
  getAnalyticsData: () => ipcRenderer.invoke('get-analytics-data'),

  // Event listeners
  onSyncCompleted: callback => {
    ipcRenderer.on('sync-completed', (event, result) => callback(result));
  },

  // Auto-update event listeners
  onUpdateStatus: callback => {
    ipcRenderer.on('update-status', (event, status) => callback(status));
    return () => ipcRenderer.removeListener('update-status', callback);
  },
});
