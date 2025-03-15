"use strict";
// Workflow manager module
const { ipcRenderer } = require('electron');
const uiManager = require('./uiManager');
const tabManager = require('./tabManager');
const projectData = require('./projectData');
// Workflow state
let currentWorkflowStep = null;
const WORKFLOW_STEPS = {
    DUPLICATE_DETECTION: 'duplicate_detection',
    PROJECT_SORTING: 'project_sorting',
    WELL_FORMULATION: 'well_formulation',
    COMPLETED: 'completed',
};
// Phase completion modal elements
let phaseCompletionModal;
let phaseCompletionTitle;
let phaseCompletionMessage;
let nextPhaseBtn;
// Lazy loading of modules to break circular dependencies
let duplicateDetector;
let reviewManager;
let wellFormulationManager;
function getDuplicateDetector() {
    if (!duplicateDetector) {
        duplicateDetector = require('./duplicateDetector');
    }
    return duplicateDetector;
}
function getReviewManager() {
    if (!reviewManager) {
        reviewManager = require('./reviewManager');
    }
    return reviewManager;
}
function getWellFormulationManager() {
    if (!wellFormulationManager) {
        wellFormulationManager = require('./wellFormulationManager');
    }
    return wellFormulationManager;
}
/**
 * Initialize workflow manager
 */
function initialize() {
    console.log('Initializing workflow manager');
    // Initialize phase completion modal elements
    phaseCompletionModal = document.getElementById('phase-completion-modal');
    phaseCompletionTitle = document.getElementById('phase-completion-title');
    phaseCompletionMessage = document.getElementById('phase-completion-message');
    nextPhaseBtn = document.getElementById('next-phase-btn');
    // Set up event listeners
    if (nextPhaseBtn) {
        nextPhaseBtn.addEventListener('click', () => {
            hidePhaseCompletionModal();
            executeNextPhase();
        });
    }
    // Log initialization
    console.log('Workflow manager initialized');
}
/**
 * Start the complete workflow process
 * This initiates the three-phase review process:
 * 1. Duplicate Detection
 * 2. Project Sorting
 * 3. Well-Formulation
 */
async function startWorkflow() {
    console.log('Starting workflow process');
    // Check if a workflow is already in progress
    if (currentWorkflowStep) {
        console.log('Workflow already in progress:', currentWorkflowStep);
        // If workflow is already in progress, continue from current step
        switch (currentWorkflowStep) {
            case WORKFLOW_STEPS.DUPLICATE_DETECTION:
                await startDuplicateDetectionPhase();
                break;
            case WORKFLOW_STEPS.PROJECT_SORTING:
                await startProjectSortingPhase();
                break;
            case WORKFLOW_STEPS.WELL_FORMULATION:
                await startWellFormulationPhase();
                break;
            case WORKFLOW_STEPS.COMPLETED:
                // If workflow is completed, start a new one
                currentWorkflowStep = null;
                await startWorkflow();
                break;
            default:
                console.error('Unknown workflow step:', currentWorkflowStep);
                break;
        }
        return;
    }
    // Set initial workflow step
    currentWorkflowStep = WORKFLOW_STEPS.DUPLICATE_DETECTION;
    // Start with duplicate detection
    await startDuplicateDetectionPhase();
    console.log('Workflow process started');
}
/**
 * Start the duplicate detection phase
 */
async function startDuplicateDetectionPhase() {
    console.log('Starting duplicate detection phase');
    try {
        // Show loading notification
        uiManager.showNotification('Starting duplicate detection phase...', 'info');
        // Switch to the duplicate detection tab
        tabManager.switchTab('duplicate-detection');
        // Start duplicate detection
        const result = await getDuplicateDetector().startDuplicateDetection();
        // If no duplicates found, automatically proceed to the next phase
        if (!result ||
            !result.success ||
            !result.duplicateGroups ||
            result.duplicateGroups.length === 0) {
            console.log('No duplicates found, automatically proceeding to next phase');
            uiManager.showNotification('No duplicate projects found. Moving to project sorting phase...', 'info');
            // Short delay before moving to next phase
            setTimeout(() => {
                currentWorkflowStep = WORKFLOW_STEPS.PROJECT_SORTING;
                startProjectSortingPhase();
            }, 1500);
        }
        console.log('Duplicate detection phase started');
    }
    catch (error) {
        console.error('Error starting duplicate detection phase:', error);
        uiManager.showNotification('Error starting duplicate detection phase: ' + error.message, 'error');
    }
}
/**
 * Start the project sorting phase
 */
async function startProjectSortingPhase() {
    console.log('Starting project sorting phase');
    currentWorkflowStep = WORKFLOW_STEPS.PROJECT_SORTING;
    try {
        // Switch to the review tab
        await tabManager.switchTab('review');
        // Show notification
        uiManager.showNotification('Starting project sorting phase...', 'info');
        // Start project review
        getReviewManager().startProjectReview();
        // Note: The completion of this phase will be handled by reviewManager.endReview()
        // which will call workflowManager.moveToNextWorkflowStep()
    }
    catch (error) {
        console.error('Error in project sorting phase:', error);
        uiManager.showNotification('Error in project sorting: ' + error.message, 'error');
        await moveToNextWorkflowStep();
    }
}
/**
 * Start the well-formulation check phase
 */
async function startWellFormulationPhase() {
    console.log('Starting well-formulation check phase');
    currentWorkflowStep = WORKFLOW_STEPS.WELL_FORMULATION;
    try {
        // Switch to the well-formulation tab
        await tabManager.switchTab('well-formulation');
        // Show notification
        uiManager.showNotification('Starting well-formulation check phase...', 'info');
        // Start well-formulation check
        await getWellFormulationManager().startWellFormulationCheck();
        // Note: The completion of this phase will be handled by wellFormulationManager.completeWellFormulationCheck()
        // which will call workflowManager.moveToNextWorkflowStep()
    }
    catch (error) {
        console.error('Error in well-formulation phase:', error);
        uiManager.showNotification('Error in well-formulation check: ' + error.message, 'error');
        completeWorkflow();
    }
}
/**
 * Move to the next workflow step
 */
async function moveToNextWorkflowStep() {
    console.log('Moving to next workflow step from:', currentWorkflowStep);
    // Determine the next step based on the current step
    switch (currentWorkflowStep) {
        case WORKFLOW_STEPS.DUPLICATE_DETECTION:
            // Update current step before showing modal
            const prevStep = currentWorkflowStep;
            currentWorkflowStep = WORKFLOW_STEPS.PROJECT_SORTING;
            // Show phase completion modal for duplicate detection
            showPhaseCompletionModal('🎉 Duplicate Detection Completed!', `<p>Great job! You've successfully completed the duplicate detection phase.</p>
         <div class="workflow-progress">
           <span class="phase-indicator completed">1. Duplicate Detection ✓</span>
           <span class="phase-indicator current">2. Project Sorting</span>
           <span class="phase-indicator pending">3. Well-Formulation</span>
         </div>
         <p>In the next phase, you'll review and sort your projects one by one.</p>
         <p>Click the button below when you're ready to begin sorting your projects.</p>`, 'Begin Project Sorting');
            console.log(`Workflow transition: ${prevStep} → ${currentWorkflowStep}`);
            break;
        case WORKFLOW_STEPS.PROJECT_SORTING:
            // Update current step before showing modal
            const prevSortingStep = currentWorkflowStep;
            currentWorkflowStep = WORKFLOW_STEPS.WELL_FORMULATION;
            // Show phase completion modal for project sorting
            showPhaseCompletionModal('🎉 Project Sorting Completed!', `<p>Excellent! You've successfully completed the project sorting phase.</p>
         <div class="workflow-progress">
           <span class="phase-indicator completed">1. Duplicate Detection ✓</span>
           <span class="phase-indicator completed">2. Project Sorting ✓</span>
           <span class="phase-indicator current">3. Well-Formulation</span>
         </div>
         <p>In the final phase, you'll improve the structure of projects that need better formulation.</p>
         <p>Click the button below when you're ready to begin improving your project formulations.</p>`, 'Begin Well-Formulation');
            console.log(`Workflow transition: ${prevSortingStep} → ${currentWorkflowStep}`);
            break;
        case WORKFLOW_STEPS.WELL_FORMULATION:
            // Show phase completion modal for well-formulation
            showPhaseCompletionModal('🎉 Workflow Completed!', `<p>Congratulations! You've successfully completed the entire workflow.</p>
         <div class="workflow-progress">
           <span class="phase-indicator completed">1. Duplicate Detection ✓</span>
           <span class="phase-indicator completed">2. Project Sorting ✓</span>
           <span class="phase-indicator completed">3. Well-Formulation ✓</span>
         </div>
         <p>Your projects are now organized, sorted, and well-formulated!</p>
         <p>Would you like to start a new workflow or return to the dashboard?</p>`, 'Return to Dashboard');
            // Set workflow to completed
            const prevWellFormStep = currentWorkflowStep;
            currentWorkflowStep = WORKFLOW_STEPS.COMPLETED;
            console.log(`Workflow transition: ${prevWellFormStep} → ${currentWorkflowStep}`);
            break;
        default:
            console.error('Unknown workflow step:', currentWorkflowStep);
            break;
    }
    console.log('Workflow step transition complete. Current step:', currentWorkflowStep);
}
/**
 * Complete the workflow process
 */
function completeWorkflow() {
    console.log('Completing workflow process');
    currentWorkflowStep = WORKFLOW_STEPS.COMPLETED;
    // Switch back to active tab
    tabManager.switchTab('active');
    // Show completion notification
    uiManager.showNotification('Workflow process completed successfully', 'success');
    // Refresh projects
    projectData.loadProjects().then(projects => {
        if (projects) {
            // Trigger a refresh event
            document.dispatchEvent(new CustomEvent('projects-updated', { detail: projects }));
        }
    });
}
/**
 * Get the current workflow step
 * @returns {string|null} The current workflow step
 */
function getCurrentWorkflowStep() {
    return currentWorkflowStep;
}
/**
 * Check if a workflow is in progress
 * @returns {boolean} True if a workflow is in progress, false otherwise
 */
function isWorkflowInProgress() {
    return (currentWorkflowStep !== null &&
        currentWorkflowStep !== WORKFLOW_STEPS.COMPLETED);
}
/**
 * Show the phase completion modal
 * @param {string} title - The title for the modal
 * @param {string} message - The message to display
 * @param {string} nextPhaseText - Text for the next phase button
 */
function showPhaseCompletionModal(title, message, nextPhaseText = 'Continue to Next Phase') {
    console.log('Showing phase completion modal:', title);
    if (!phaseCompletionModal ||
        !phaseCompletionTitle ||
        !phaseCompletionMessage ||
        !nextPhaseBtn) {
        console.error('Phase completion modal elements not initialized');
        return;
    }
    // Set modal content
    phaseCompletionTitle.textContent = title;
    phaseCompletionMessage.innerHTML = message;
    nextPhaseBtn.textContent = nextPhaseText;
    // Show modal
    phaseCompletionModal.style.display = 'flex';
}
/**
 * Hide the phase completion modal
 */
function hidePhaseCompletionModal() {
    console.log('Hiding phase completion modal');
    if (phaseCompletionModal) {
        phaseCompletionModal.style.display = 'none';
    }
}
/**
 * Execute the next phase after user confirmation
 */
function executeNextPhase() {
    console.log('Executing next phase after:', currentWorkflowStep);
    switch (currentWorkflowStep) {
        case WORKFLOW_STEPS.DUPLICATE_DETECTION:
            // Move to project sorting phase
            currentWorkflowStep = WORKFLOW_STEPS.PROJECT_SORTING;
            startProjectSortingPhase();
            break;
        case WORKFLOW_STEPS.PROJECT_SORTING:
            // Move to well-formulation phase
            currentWorkflowStep = WORKFLOW_STEPS.WELL_FORMULATION;
            startWellFormulationPhase();
            break;
        case WORKFLOW_STEPS.WELL_FORMULATION:
            // Complete workflow
            completeWorkflow();
            break;
        case WORKFLOW_STEPS.COMPLETED:
            // Reset workflow and return to dashboard
            resetWorkflow();
            tabManager.switchTab('active');
            break;
        default:
            console.error('Unknown workflow step for next phase:', currentWorkflowStep);
            break;
    }
}
/**
 * Reset the workflow state
 */
function resetWorkflow() {
    console.log('Resetting workflow state');
    // Reset workflow state
    currentWorkflowStep = null;
    // Switch back to active tab
    tabManager.switchTab('active');
    // Show notification
    uiManager.showNotification('Workflow has been reset', 'info');
    // Refresh projects
    projectData.loadProjects().then(projects => {
        if (projects) {
            // Trigger a refresh event
            document.dispatchEvent(new CustomEvent('projects-updated', { detail: projects }));
        }
    });
    console.log('Workflow has been reset');
}
// Export functions for use in other modules
module.exports = {
    initialize,
    startWorkflow,
    moveToNextWorkflowStep,
    completeWorkflow,
    executeNextPhase,
    getCurrentWorkflowStep: () => currentWorkflowStep,
    isWorkflowInProgress: () => currentWorkflowStep !== null,
    showPhaseCompletionModal,
    hidePhaseCompletionModal,
    resetWorkflow: () => {
        currentWorkflowStep = null;
    },
    WORKFLOW_STEPS,
    getDuplicateDetector,
    getReviewManager,
    getWellFormulationManager,
};
//# sourceMappingURL=workflowManager.js.map