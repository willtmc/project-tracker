"use strict";
const { contextBridge, ipcRenderer } = require('electron');
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
    getProjects: () => ipcRenderer.invoke('get-projects'),
    saveProject: project => ipcRenderer.invoke('save-project', project),
    updateProjectStatus: project => ipcRenderer.invoke('update-project-status', project),
    validateProject: projectPath => ipcRenderer.invoke('validate-project', projectPath),
    reformulateProject: (projectPath, endState) => ipcRenderer.invoke('reformulate-project', projectPath, endState),
    generateReport: () => ipcRenderer.invoke('generate-report'),
    findPotentialDuplicates: () => ipcRenderer.invoke('find-potential-duplicates'),
    mergeDuplicateProjects: projectIds => ipcRenderer.invoke('merge-duplicate-projects', projectIds),
    mergeProjects: projectPaths => ipcRenderer.invoke('merge-projects', projectPaths),
    getProjectsWithPotentialDuplicates: () => ipcRenderer.invoke('get-projects-with-potential-duplicates'),
    retryDatabaseOperation: () => ipcRenderer.invoke('retry-database-operation'),
    synchronizeProjects: () => ipcRenderer.invoke('synchronize-projects'),
    // Event listeners
    onSyncCompleted: callback => {
        ipcRenderer.on('sync-completed', (event, result) => callback(result));
    },
});
//# sourceMappingURL=preload.js.map