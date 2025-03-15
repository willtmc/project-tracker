"use strict";
// Well-formulation manager module
const { ipcRenderer } = require('electron');
const uiManager = require('./uiManager');
const projectData = require('./projectData');
const utils = require('./utils');
const tabManager = require('./tabManager');
const workflowManager = require('./workflowManager');
const { marked } = require('marked');
// State variables for well-formulation check
let isInWellFormulationMode = false;
let currentProjectIndex = 0;
let projectsToImprove = [];
let currentProject = null;
// UI elements
let wellFormulationContainer;
let projectTitleElement;
let projectContentElement;
let endStateInputElement;
let reformulateButtonElement;
let skipButtonElement;
let wellFormulationInstructions;
/**
 * Initialize well-formulation elements
 */
function initializeWellFormulationElements() {
    console.log('Initializing well-formulation elements');
    // Get well-formulation container and elements
    wellFormulationContainer = document.querySelector('.well-formulation-container');
    projectTitleElement = document.getElementById('well-formulation-project-title');
    projectContentElement = document.getElementById('well-formulation-project-content');
    endStateInputElement = document.getElementById('end-state-input');
    reformulateButtonElement = document.getElementById('reformulate-btn');
    skipButtonElement = document.getElementById('skip-reformulation-btn');
    wellFormulationInstructions = document.querySelector('.well-formulation-instructions');
    // Log elements for debugging
    console.log('Well-formulation elements initialized:', {
        container: !!wellFormulationContainer,
        title: !!projectTitleElement,
        content: !!projectContentElement,
        endStateInput: !!endStateInputElement,
        reformulateBtn: !!reformulateButtonElement,
        skipBtn: !!skipButtonElement,
        instructions: !!wellFormulationInstructions,
    });
}
/**
 * Start the well-formulation check process
 */
async function startWellFormulationCheck() {
    console.log('Starting well-formulation check');
    // Check if well-formulation elements are initialized
    if (!wellFormulationContainer ||
        !projectTitleElement ||
        !projectContentElement ||
        !wellFormulationInstructions) {
        console.error('Well-formulation elements not initialized');
        uiManager.showNotification('Error: Well-formulation elements not initialized', 'error');
        return;
    }
    // Get projects data
    const projectsData = projectData.getProjectsData();
    // Check if projects data is available
    if (!projectsData ||
        !projectsData.active ||
        projectsData.active.length === 0) {
        console.error('No active projects available for well-formulation check');
        uiManager.showNotification('No active projects available for well-formulation check', 'error');
        return;
    }
    // Set well-formulation mode
    isInWellFormulationMode = true;
    // Find projects that need improvement
    projectsToImprove = findProjectsNeedingImprovement(projectsData.active);
    // Check if there are projects to improve
    if (projectsToImprove.length === 0) {
        console.log('No projects need improvement');
        wellFormulationContainer.style.display = 'block';
        projectTitleElement.textContent = 'No Projects Need Improvement';
        projectContentElement.innerHTML =
            '<p>All of your active projects are already well-formulated. Great job!</p>';
        wellFormulationInstructions.innerHTML =
            '<p>Click the "Complete Well-Formulation" button to finish the process.</p>';
        // Hide input and buttons
        if (endStateInputElement) {
            endStateInputElement.style.display = 'none';
        }
        // Show complete well-formulation button and hide other buttons
        const reformulateBtn = document.getElementById('reformulate-btn');
        const skipReformulationBtn = document.getElementById('skip-reformulation-btn');
        const completeWellFormulationBtn = document.getElementById('complete-well-formulation-btn');
        if (reformulateBtn) {
            reformulateBtn.style.display = 'none';
        }
        if (skipReformulationBtn) {
            skipReformulationBtn.style.display = 'none';
        }
        if (completeWellFormulationBtn) {
            completeWellFormulationBtn.style.display = 'block';
        }
        return;
    }
    // Reset project index
    currentProjectIndex = 0;
    // Show well-formulation container
    wellFormulationContainer.style.display = 'block';
    // Show buttons and hide complete button
    const reformulateBtn = document.getElementById('reformulate-btn');
    const skipReformulationBtn = document.getElementById('skip-reformulation-btn');
    const completeWellFormulationBtn = document.getElementById('complete-well-formulation-btn');
    if (reformulateBtn) {
        reformulateBtn.style.display = 'block';
    }
    if (skipReformulationBtn) {
        skipReformulationBtn.style.display = 'block';
    }
    if (completeWellFormulationBtn) {
        completeWellFormulationBtn.style.display = 'none';
    }
    if (endStateInputElement) {
        endStateInputElement.style.display = 'block';
        endStateInputElement.value = '';
    }
    // Display the first project
    displayCurrentProject();
    console.log(`Started well-formulation check with ${projectsToImprove.length} projects to improve`);
}
/**
 * Display the current project to improve
 */
function displayCurrentProject() {
    console.log('Displaying current project for well-formulation');
    if (!projectsToImprove ||
        projectsToImprove.length === 0 ||
        currentProjectIndex >= projectsToImprove.length) {
        console.log('No more projects to improve');
        completeWellFormulationCheck();
        return;
    }
    // Get the current project
    currentProject = projectsToImprove[currentProjectIndex];
    // Make sure well-formulation container is visible
    if (wellFormulationContainer) {
        wellFormulationContainer.style.display = 'block';
    }
    // Update instructions
    if (wellFormulationInstructions) {
        wellFormulationInstructions.innerHTML = `
      <h3>Well-Formulation Instructions</h3>
      <p>This project needs improvement in its structure. Please help reformulate it by:</p>
      <ol>
        <li>Review the current project content below</li>
        <li>Provide a clear end state for the project</li>
        <li>Click "Reformulate Project" to improve the project structure</li>
      </ol>
      <p><strong>Project ${currentProjectIndex + 1} of ${projectsToImprove.length}</strong></p>
    `;
    }
    // Display project title
    if (projectTitleElement) {
        projectTitleElement.textContent =
            currentProject.title || 'Untitled Project';
    }
    // Display project content
    if (projectContentElement) {
        // Use marked to render markdown
        projectContentElement.innerHTML = marked.parse(currentProject.content || '');
    }
    // Clear end state input
    if (endStateInputElement) {
        endStateInputElement.value = '';
    }
    console.log('Current project displayed for well-formulation:', currentProject.title);
}
/**
 * Reformulate the current project
 */
async function reformulateCurrentProject() {
    if (!currentProject || !endStateInputElement) {
        console.error('Current project or end state input is null');
        return;
    }
    const endState = endStateInputElement.value.trim();
    if (!endState) {
        uiManager.showNotification('Please enter an end state for the project', 'warning');
        return;
    }
    try {
        // Show loading notification
        uiManager.showNotification('Reformulating project...', 'info');
        // Call the main process to reformulate the project
        const result = await ipcRenderer.invoke('reformulate-project', {
            project: currentProject,
            endState: endState,
        });
        if (result.success) {
            uiManager.showNotification('Project reformulated successfully', 'success');
            // Update the project in the database
            await projectData.updateProject(result.project);
            // Move to the next project
            moveToNextProject();
        }
        else {
            uiManager.showNotification('Failed to reformulate project: ' + result.message, 'error');
        }
    }
    catch (error) {
        console.error('Error reformulating project:', error);
        uiManager.showNotification('Error reformulating project: ' + error.message, 'error');
    }
}
/**
 * Skip the current project
 */
function skipCurrentProject() {
    console.log('Skipping project:', currentProject?.title);
    moveToNextProject();
}
/**
 * Move to the next project in the well-formulation check
 */
function moveToNextProject() {
    console.log('Moving to next project in well-formulation check');
    // Increment project index
    currentProjectIndex++;
    // Check if we've reached the end of the projects
    if (currentProjectIndex >= projectsToImprove.length) {
        console.log('Reached the end of projects to improve');
        // Show completion message
        if (projectTitleElement) {
            projectTitleElement.textContent = 'Well-Formulation Complete!';
        }
        if (projectContentElement) {
            projectContentElement.innerHTML = `
        <div class="well-formulation-complete">
          <h3>🎉 All projects have been improved!</h3>
          <p>You have successfully improved all ${projectsToImprove.length} projects that needed better formulation.</p>
          <p>Click the "Complete Well-Formulation" button to finish the process.</p>
        </div>
      `;
        }
        // Update instructions
        if (wellFormulationInstructions) {
            wellFormulationInstructions.innerHTML = `
        <h3>Well-Formulation Complete</h3>
        <p>You have improved all ${projectsToImprove.length} projects that needed better formulation.</p>
        <p>Click the "Complete Well-Formulation" button to finish.</p>
      `;
        }
        // Hide input and buttons
        if (endStateInputElement) {
            endStateInputElement.style.display = 'none';
        }
        // Show complete well-formulation button and hide other buttons
        const reformulateBtn = document.getElementById('reformulate-btn');
        const skipReformulationBtn = document.getElementById('skip-reformulation-btn');
        const completeWellFormulationBtn = document.getElementById('complete-well-formulation-btn');
        if (reformulateBtn) {
            reformulateBtn.style.display = 'none';
        }
        if (skipReformulationBtn) {
            skipReformulationBtn.style.display = 'none';
        }
        if (completeWellFormulationBtn) {
            completeWellFormulationBtn.style.display = 'block';
        }
        return;
    }
    // Display the next project
    displayCurrentProject();
}
/**
 * Complete the well-formulation check process
 */
function completeWellFormulationCheck() {
    console.log('Completing well-formulation check');
    // Reset state
    isInWellFormulationMode = false;
    currentProjectIndex = 0;
    projectsToImprove = [];
    currentProject = null;
    // Hide well-formulation container
    if (wellFormulationContainer) {
        wellFormulationContainer.style.display = 'none';
    }
    // Reset UI elements
    if (projectTitleElement) {
        projectTitleElement.textContent = '';
    }
    if (projectContentElement) {
        projectContentElement.innerHTML = '';
    }
    if (wellFormulationInstructions) {
        wellFormulationInstructions.innerHTML = '';
    }
    // Reset buttons
    const reformulateBtn = document.getElementById('reformulate-btn');
    const skipReformulationBtn = document.getElementById('skip-reformulation-btn');
    const completeWellFormulationBtn = document.getElementById('complete-well-formulation-btn');
    if (reformulateBtn) {
        reformulateBtn.style.display = 'none';
    }
    if (skipReformulationBtn) {
        skipReformulationBtn.style.display = 'none';
    }
    if (completeWellFormulationBtn) {
        completeWellFormulationBtn.style.display = 'none';
    }
    // Show notification
    uiManager.showNotification('Workflow complete! All projects have been reviewed and improved.', 'success');
    // Create a workflow completion modal
    const modalContent = `
    <div class="modal-content workflow-completion">
      <h2>🎉 Workflow Complete! 🎉</h2>
      <p>Congratulations! You have successfully completed the entire workflow:</p>
      <ol>
        <li>✅ <strong>Duplicate Detection</strong>: All potential duplicates have been identified and merged.</li>
        <li>✅ <strong>Project Sorting</strong>: All projects have been reviewed and organized.</li>
        <li>✅ <strong>Well-Formulation</strong>: All projects have been improved for clarity and actionability.</li>
      </ol>
      <p>Your project list is now optimized and ready for execution!</p>
      <button id="workflow-completion-btn" class="btn btn-primary">Return to Dashboard</button>
    </div>
  `;
    // Show the completion modal
    uiManager.showModal(modalContent, false);
    // Add event listener for the completion button
    const completionBtn = document.getElementById('workflow-completion-btn');
    if (completionBtn) {
        completionBtn.addEventListener('click', () => {
            uiManager.hideModal();
            // Navigate to the dashboard tab
            const dashboardTab = document.getElementById('dashboard-tab');
            if (dashboardTab) {
                uiManager.showTab('dashboard-tab');
            }
        });
    }
    // Move to the next workflow step if we're in a workflow
    try {
        if (workflowManager &&
            typeof workflowManager.getCurrentWorkflowStep === 'function' &&
            workflowManager.getCurrentWorkflowStep() ===
                workflowManager.WORKFLOW_STEPS.WELL_FORMULATION) {
            // Short delay before moving to next phase for better user experience
            setTimeout(() => {
                workflowManager.moveToNextWorkflowStep();
            }, 1000);
        }
    }
    catch (error) {
        console.error('Error moving to next workflow step:', error);
    }
}
/**
 * Set up well-formulation event listeners
 */
function setupWellFormulationEventListeners() {
    console.log('Setting up well-formulation event listeners');
    // Get buttons
    const reformulateBtn = document.getElementById('reformulate-btn');
    const skipBtn = document.getElementById('skip-reformulation-btn');
    const completeWellFormulationBtn = document.getElementById('complete-well-formulation-btn');
    // Add click event listeners
    if (reformulateBtn) {
        reformulateBtn.addEventListener('click', () => {
            reformulateCurrentProject();
        });
    }
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            skipCurrentProject();
        });
    }
    if (completeWellFormulationBtn) {
        completeWellFormulationBtn.addEventListener('click', () => {
            console.log('Complete well-formulation button clicked');
            completeWellFormulationCheck();
        });
    }
    console.log('Well-formulation event listeners set up');
}
/**
 * Check if in well-formulation mode
 * @returns {boolean} True if in well-formulation mode, false otherwise
 */
function isWellFormulationMode() {
    return isInWellFormulationMode;
}
/**
 * Find projects that need improvement in their formulation
 * @param {Array} projects - The list of projects to check
 * @returns {Array} - Projects that need improvement
 */
function findProjectsNeedingImprovement(projects) {
    console.log('Finding projects that need improvement');
    // Filter projects that need improvement
    const projectsNeedingImprovement = projects.filter(project => {
        // Check if project has an action verb in the title
        const hasTitleAction = utils.checkTitleHasAction(project.title);
        // Check if project has an End State section
        const hasEndState = project.content.includes('## End State') ||
            project.content.includes('# End State');
        // Check if project has a Tasks section
        const hasTasks = project.content.includes('## Tasks') ||
            project.content.includes('# Tasks');
        // Project needs improvement if it's missing any of these elements
        return !hasTitleAction || !hasEndState || !hasTasks;
    });
    console.log(`Found ${projectsNeedingImprovement.length} projects that need improvement out of ${projects.length} total projects`);
    return projectsNeedingImprovement;
}
// Export functions for use in other modules
module.exports = {
    initializeWellFormulationElements,
    setupWellFormulationEventListeners,
    startWellFormulationCheck,
    reformulateCurrentProject,
    completeWellFormulationCheck,
    isWellFormulationMode,
    findProjectsNeedingImprovement,
};
//# sourceMappingURL=wellFormulationManager.js.map