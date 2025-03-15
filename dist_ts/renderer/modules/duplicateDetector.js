"use strict";
// Duplicate detection module
const { ipcRenderer } = require('electron');
const uiManager = require('./uiManager');
const projectData = require('./projectData');
const workflowManager = require('./workflowManager');
const logger = require('./logger');
// State variables for duplicate detection
let duplicateGroups = [];
let currentDuplicateGroup = null;
let currentDuplicateIndex = 0;
let isReviewingDuplicates = false;
let selectedProjects = new Set(); // Track selected projects for merge
/**
 * Handle the entire duplicate detection process from start to finish
 * This function will be called directly from the Start Duplicate Detection button
 */
async function handleDuplicateDetection() {
    console.log('Handling duplicate detection process');
    logger.debug('duplicateDetector', 'Starting duplicate detection process');
    try {
        // 1. Show loading notification
        uiManager.showNotification('Searching for potential duplicate projects...', 'info');
        // Add loading state to the button
        const startButton = document.getElementById('start-duplicate-detection-btn');
        if (startButton) {
            startButton.disabled = true;
            startButton.textContent = 'Searching...';
        }
        // 2. Find potential duplicates
        console.log('Sending duplicate detection request to main process...');
        const result = await ipcRenderer.invoke('find-potential-duplicates');
        console.log('Duplicate detection result:', result);
        // Log more details about the result
        if (result) {
            console.log('Result success:', result.success);
            console.log('Result has duplicateGroups property:', result.hasOwnProperty('duplicateGroups'));
            if (result.duplicateGroups) {
                console.log('Duplicate groups is array:', Array.isArray(result.duplicateGroups));
                console.log('Duplicate groups length:', result.duplicateGroups.length);
            }
            if (result.message) {
                console.log('Result message:', result.message);
            }
        }
        else {
            console.error('Result is null or undefined');
        }
        // Reset button state
        if (startButton) {
            startButton.disabled = false;
            startButton.textContent = 'Start Duplicate Detection';
        }
        // 3. Check if we have valid duplicate groups
        logger.debug('duplicateDetector', 'Checking duplicate detection result', result);
        // Detailed condition checking with individual logging
        if (!result) {
            console.error('CRITICAL ERROR: Result is null or undefined');
        }
        else if (!result.success) {
            console.error('CRITICAL ERROR: Result indicates failure', result.message || 'No error message');
        }
        else if (!result.duplicateGroups) {
            console.error('CRITICAL ERROR: No duplicateGroups property in result');
        }
        else if (!Array.isArray(result.duplicateGroups)) {
            console.error('CRITICAL ERROR: duplicateGroups is not an array', typeof result.duplicateGroups);
        }
        else if (result.duplicateGroups.length === 0) {
            console.error('CRITICAL ERROR: duplicateGroups array is empty');
        }
        if (result &&
            result.success &&
            result.duplicateGroups &&
            Array.isArray(result.duplicateGroups) &&
            result.duplicateGroups.length > 0) {
            // Store the duplicate groups
            duplicateGroups = result.duplicateGroups;
            console.log(`Found ${duplicateGroups.length} potential duplicate groups to review`);
            logger.debug('duplicateDetector', `Found ${duplicateGroups.length} potential duplicate groups to review`);
            // Log detailed information about each group
            duplicateGroups.forEach((group, groupIndex) => {
                logger.debug('duplicateDetector', `Group ${groupIndex + 1} has ${group.length} projects:`);
                group.forEach((project, projectIndex) => {
                    logger.debug('duplicateDetector', `  Project ${projectIndex + 1}: ${project.title || 'Untitled'} - ${project.path || 'No path'}`);
                });
            });
            // Log each duplicate group for debugging
            duplicateGroups.forEach((group, idx) => {
                console.log(`Duplicate group ${idx + 1}:`);
                group.forEach(project => {
                    console.log(`- ${project.title} (${project.path})`);
                });
            });
            // Update the duplicates count
            const duplicatesCount = document.getElementById('duplicates-count');
            if (duplicatesCount) {
                duplicatesCount.textContent = duplicateGroups.length;
            }
            // Show success notification with more detailed message
            uiManager.showNotification(`Found ${duplicateGroups.length} potential duplicate groups ready for review`, 'success');
            // 4. Make sure duplicate review container exists
            const duplicateReviewContainer = document.getElementById('duplicate-review-container');
            if (!duplicateReviewContainer) {
                console.log('Duplicate review container not found, creating it');
                createDuplicateReviewContainer();
            }
            // Switch to the duplicates tab
            const tabButtons = document.querySelectorAll('.tab-btn');
            tabButtons.forEach(button => {
                if (button.getAttribute('data-tab') === 'duplicates') {
                    button.click();
                }
            });
            // 5. Set up the duplicate review
            // Reset selection state
            selectedProjects = new Set();
            // Set review mode
            isReviewingDuplicates = true;
            // Set current duplicate group to the first group
            currentDuplicateIndex = 0;
            currentDuplicateGroup = duplicateGroups[currentDuplicateIndex];
            // 6. Set up event listeners for the duplicate review buttons
            setupDuplicateReviewEventListeners();
            // 7. Display the first duplicate group
            displayDuplicateGroup();
        }
        else {
            console.log('No duplicates found or empty result:', result);
            // Check if we have a specific message from the backend
            if (result && result.message) {
                console.log('Message from backend:', result.message);
                uiManager.showNotification(result.message, 'info');
            }
            else {
                uiManager.showNotification('No potential duplicate projects found', 'info');
            }
            // Update the duplicates count to 0
            const duplicatesCount = document.getElementById('duplicates-count');
            if (duplicatesCount) {
                duplicatesCount.textContent = '0';
            }
            // Hide the duplicate review container if it's visible
            const duplicateReviewContainer = document.getElementById('duplicate-review-container');
            if (duplicateReviewContainer) {
                duplicateReviewContainer.style.display = 'none';
            }
        }
    }
    catch (error) {
        // Reset button state
        const startButton = document.getElementById('start-duplicate-detection-btn');
        if (startButton) {
            startButton.disabled = false;
            startButton.textContent = 'Start Duplicate Detection';
        }
        console.error('Error handling duplicate detection:', error);
        uiManager.showNotification('Error detecting duplicates: ' + error.message, 'error');
    }
}
/**
 * Show the duplicate review container and hide other elements
 */
function showDuplicateReviewContainer() {
    console.log('Showing duplicate review container');
    try {
        // Get the duplicate review container
        const duplicateReviewContainer = document.getElementById('duplicate-review-container');
        if (!duplicateReviewContainer) {
            console.error('CRITICAL: Duplicate review container not found in the DOM');
            // Force appearance in duplicates tab
            const duplicatesTab = document.getElementById('duplicates-tab');
            if (duplicatesTab) {
                console.log('Found duplicates tab, forcibly creating container');
                // Create a new container element
                const newContainer = document.createElement('div');
                newContainer.id = 'duplicate-review-container';
                newContainer.className =
                    'review-container border border-gray-300 rounded p-4 mt-4';
                newContainer.style.display = 'block';
                // Add basic structure
                newContainer.innerHTML = `
          <div class="duplicate-group-counter mb-4 p-2 bg-gray-100 rounded">
            <strong>Group <span id="current-group-num">1</span> of <span id="total-groups">${duplicateGroups.length}</span></strong>
          </div>
          
          <div id="duplicate-list" class="space-y-4 bg-white p-4 border border-gray-200 rounded mb-4">
            <!-- Duplicate projects will be inserted here -->
          </div>
          
          <div class="duplicate-actions flex gap-2">
            <button id="merge-duplicates-btn" class="btn btn-primary">Merge Selected</button>
            <button id="skip-duplicate-btn" class="btn btn-secondary">Skip</button>
            <button id="end-duplicate-review-btn" class="btn btn-error">Cancel</button>
          </div>
        `;
                // Insert the container right after the debug panel or at the beginning of the tab
                const debugPanel = document.getElementById('debug-panel');
                if (debugPanel && debugPanel.parentNode) {
                    console.log('Inserting duplicate review container after debug panel');
                    debugPanel.parentNode.insertBefore(newContainer, debugPanel.nextSibling);
                }
                else {
                    console.log('Appending duplicate review container to duplicates tab');
                    duplicatesTab.appendChild(newContainer);
                }
                // Now setup event listeners for the buttons
                setupDuplicateReviewEventListeners();
                return true;
            }
            console.error('CRITICAL: Could not create duplicate review container');
            return false;
        }
        // Make sure container is visible with !important style
        duplicateReviewContainer.setAttribute('style', 'display: block !important');
        console.log('Made duplicate review container visible with !important style');
        // Ensure the duplicate list is visible
        const duplicateList = document.getElementById('duplicate-list');
        if (duplicateList) {
            duplicateList.setAttribute('style', 'display: block !important');
            console.log('Duplicate list is visible');
        }
        else {
            console.error('CRITICAL: Duplicate list not found');
            // Create the list if it doesn't exist
            if (duplicateReviewContainer) {
                const newList = document.createElement('div');
                newList.id = 'duplicate-list';
                newList.className =
                    'space-y-4 bg-white p-4 border border-gray-200 rounded mb-4';
                newList.style.display = 'block';
                // Find where to insert the list
                const counter = duplicateReviewContainer.querySelector('.duplicate-group-counter');
                if (counter && counter.nextSibling) {
                    duplicateReviewContainer.insertBefore(newList, counter.nextSibling);
                }
                else {
                    duplicateReviewContainer.appendChild(newList);
                }
                console.log('Created new duplicate list element');
            }
        }
        // Show the duplicates tab
        const duplicatesTab = document.getElementById('duplicates-tab');
        if (duplicatesTab) {
            duplicatesTab.style.display = 'block';
            console.log('Made duplicates tab visible');
        }
        return true;
    }
    catch (error) {
        console.error('CRITICAL ERROR in showDuplicateReviewContainer:', error);
        return false;
    }
}
/**
 * Start reviewing duplicate projects
 */
function startDuplicateReview() {
    console.log('Starting duplicate review');
    if (!duplicateGroups || duplicateGroups.length === 0) {
        console.error('No duplicate groups to review');
        uiManager.showNotification('No duplicate groups to review', 'error');
        return;
    }
    // Reset selection state
    selectedProjects = new Set();
    // Set review mode
    isReviewingDuplicates = true;
    // Set current duplicate group to the first group
    currentDuplicateIndex = 0;
    currentDuplicateGroup = duplicateGroups[currentDuplicateIndex];
    console.log('Current duplicate group set to:', currentDuplicateGroup);
    // Show the duplicate review container
    if (!showDuplicateReviewContainer()) {
        return;
    }
    // Set up event listeners for the duplicate review buttons
    setupDuplicateReviewEventListeners();
    // Display the first duplicate group
    displayDuplicateGroup();
}
/**
 * Create duplicate review container if it doesn't exist
 */
function createDuplicateReviewContainer() {
    console.log('Creating duplicate review container');
    // Check if container already exists
    const existingContainer = document.getElementById('duplicate-review-container');
    if (existingContainer) {
        console.log('Duplicate review container already exists, making it visible');
        existingContainer.style.display = 'block';
        return;
    }
    // Find the duplicates tab element
    const duplicatesTab = document.getElementById('duplicates-tab');
    if (duplicatesTab) {
        console.log('Found duplicates tab, inserting container');
        // Create the container
        const container = document.createElement('div');
        container.id = 'duplicate-review-container';
        container.className = 'review-container';
        container.style.display = 'block';
        // Add header and controls
        container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl">Duplicate Project Review</h3>
        <div class="duplicate-group-counter">
          Group <span id="current-group-num">1</span> of <span id="total-groups">0</span>
        </div>
      </div>
      <div class="flex gap-3 mb-4">
        <button id="merge-duplicates-btn" class="btn btn-primary">Merge Projects</button>
        <button id="skip-duplicate-btn" class="btn btn-secondary">Skip</button>
        <button id="end-duplicate-review-btn" class="btn btn-error">Cancel</button>
      </div>
      <div id="duplicate-list" class="card p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <!-- Duplicate projects will be displayed here -->
      </div>
    `;
        // Find the right insertion point (after the Start Duplicate Detection button)
        const insertAfter = duplicatesTab.querySelector('.review-actions') ||
            duplicatesTab.firstChild;
        if (insertAfter && insertAfter.parentNode) {
            insertAfter.parentNode.insertBefore(container, insertAfter.nextSibling);
            console.log('Container added to the DOM');
        }
        else {
            // Fallback to just appending to the tab
            duplicatesTab.appendChild(container);
            console.log('Container appended to duplicates tab');
        }
    }
    else {
        // Fallback approach if we can't find the duplicates tab
        console.warn('Duplicates tab not found, using fallback approach');
        // Find a suitable parent element - try the active tab or main content area
        const activeTab = document.getElementById('active-tab') ||
            document.querySelector('.tab-pane[style*="display: block"]');
        const mainContent = activeTab ||
            document.querySelector('.main-content') ||
            document.querySelector('.content') ||
            document.body;
        // Create the container
        const container = document.createElement('div');
        container.id = 'duplicate-review-container';
        container.className = 'review-container';
        container.style.display = 'block';
        // Add header and controls
        container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl">Duplicate Project Review</h3>
        <div class="duplicate-group-counter">
          Group <span id="current-group-num">1</span> of <span id="total-groups">0</span>
        </div>
      </div>
      <div class="flex gap-3 mb-4">
        <button id="merge-duplicates-btn" class="btn btn-primary">Merge Projects</button>
        <button id="skip-duplicate-btn" class="btn btn-secondary">Skip</button>
        <button id="end-duplicate-review-btn" class="btn btn-error">Cancel</button>
      </div>
      <div id="duplicate-list" class="card p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <!-- Duplicate projects will be displayed here -->
      </div>
    `;
        // Add to the DOM
        mainContent.appendChild(container);
        console.log('Container added to main content');
    }
    // Update the groups counter
    const totalGroupsElement = document.getElementById('total-groups');
    if (totalGroupsElement && duplicateGroups) {
        totalGroupsElement.textContent = duplicateGroups.length;
    }
    // Set up event listeners
    setupDuplicateReviewEventListeners();
}
/**
 * Set up event listeners for duplicate review buttons
 */
function setupDuplicateReviewEventListeners() {
    console.log('Setting up duplicate review event listeners');
    // Get the buttons
    const mergeBtn = document.getElementById('merge-duplicates-btn');
    const skipBtn = document.getElementById('skip-duplicate-btn');
    const endBtn = document.getElementById('end-duplicate-review-btn');
    console.log('Duplicate review buttons found:', {
        mergeBtn: !!mergeBtn,
        skipBtn: !!skipBtn,
        endBtn: !!endBtn,
    });
    // Remove existing event listeners if any
    if (mergeBtn) {
        const newMergeBtn = mergeBtn.cloneNode(true);
        mergeBtn.parentNode.replaceChild(newMergeBtn, mergeBtn);
        newMergeBtn.addEventListener('click', mergeSelectedProjects);
        console.log('Merge button event listener set up');
    }
    if (skipBtn) {
        const newSkipBtn = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);
        newSkipBtn.addEventListener('click', skipDuplicateGroup);
        console.log('Skip button event listener set up');
    }
    if (endBtn) {
        const newEndBtn = endBtn.cloneNode(true);
        endBtn.parentNode.replaceChild(newEndBtn, endBtn);
        newEndBtn.addEventListener('click', endDuplicateReview);
        console.log('End button event listener set up');
    }
}
/**
 * Display the current duplicate group
 */
function displayDuplicateGroup() {
    if (!currentDuplicateGroup || currentDuplicateGroup.length === 0) {
        console.error('No duplicate group to display');
        logger.debug('duplicateDetector', 'ERROR: No duplicate group to display');
        return;
    }
    console.log('Displaying duplicate group with', currentDuplicateGroup.length, 'projects');
    logger.debug('duplicateDetector', `Displaying duplicate group ${currentDuplicateIndex + 1}/${duplicateGroups.length} with ${currentDuplicateGroup.length} projects`);
    // Log current duplicate group details
    logger.debug('duplicateDetector', 'Current duplicate group details:');
    currentDuplicateGroup.forEach((project, idx) => {
        logger.debug('duplicateDetector', `  Project ${idx + 1}: ${project.title || 'Untitled'} - ${project.path || 'No path'}`);
    });
    // Show the duplicate review container first
    showDuplicateReviewContainer();
    // Make sure container is visible
    const duplicateReviewContainer = document.getElementById('duplicate-review-container');
    if (duplicateReviewContainer) {
        console.log('Making duplicate-review-container visible');
        duplicateReviewContainer.style.display = 'block';
    }
    else {
        console.error('Cannot find duplicate-review-container, something is wrong');
    }
    // Get the duplicate list container - first try the ID from the HTML template
    let duplicateList = document.getElementById('duplicate-list-container');
    console.log('Found duplicate-list-container element:', !!duplicateList);
    // If not found, try the ID from the JavaScript
    if (!duplicateList) {
        duplicateList = document.getElementById('duplicate-list');
        console.log('Found duplicate-list element:', !!duplicateList);
    }
    // If still not found, create it
    if (!duplicateList) {
        console.error('No duplicate list container found, creating a new one');
        duplicateList = document.createElement('div');
        duplicateList.id = 'duplicate-list';
        duplicateList.className =
            'duplicate-list bg-white border border-gray-200 p-4 rounded-lg max-h-[70vh] overflow-y-auto';
        const container = document.getElementById('duplicate-review-container');
        if (container) {
            container.appendChild(duplicateList);
            console.log('Appended new duplicate list to container');
        }
        else {
            console.error('Parent container not found, cannot create duplicate list');
            return;
        }
    }
    // Make sure it's visible
    duplicateList.style.display = 'block';
    // Clear the duplicate list and selection state
    duplicateList.innerHTML = '';
    selectedProjects.clear();
    // Add group counter and progress indicator
    const progressHeader = document.createElement('div');
    progressHeader.className =
        'flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400';
    progressHeader.innerHTML = `
    <div>Group ${currentDuplicateIndex + 1} of ${duplicateGroups.length}</div>
    <div>${currentDuplicateGroup.length} potential duplicates found</div>
  `;
    duplicateList.appendChild(progressHeader);
    // Add instructions
    const instructions = document.createElement('div');
    instructions.className =
        'p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800';
    instructions.innerHTML = `
    <h4 class="font-medium mb-2 text-blue-800 dark:text-blue-300">Instructions</h4>
    <ul class="list-disc pl-5 space-y-1 text-sm">
      <li>Review each project below to determine if they are duplicates</li>
      <li>Select projects to merge by clicking the checkbox next to each one</li>
      <li>Click "Merge Projects" to combine selected projects</li>
      <li>Click "Skip" if these are not duplicates</li>
    </ul>
  `;
    duplicateList.appendChild(instructions);
    // Create a container for each project in the duplicate group
    console.log(`Creating ${currentDuplicateGroup.length} project containers for duplicate group`);
    currentDuplicateGroup.forEach((project, index) => {
        console.log(`Creating container for project ${index}: ${project.title || 'Untitled'}`);
        const projectContainer = document.createElement('div');
        projectContainer.className =
            'duplicate-project bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4 hover:shadow-md transition-shadow';
        projectContainer.dataset.path = project.path;
        projectContainer.dataset.index = index;
        // Create project header with checkbox, title and path
        const projectHeader = document.createElement('div');
        projectHeader.className = 'flex items-start gap-3 mb-3';
        // Add checkbox for selection
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className =
            'mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-secondary-700';
        checkbox.dataset.path = project.path;
        // Set checkbox checked by default
        checkbox.checked = true;
        selectedProjects.add(project.path);
        checkbox.addEventListener('change', e => {
            if (e.target.checked) {
                selectedProjects.add(project.path);
            }
            else {
                selectedProjects.delete(project.path);
            }
            updateMergeButtonState();
        });
        // Create title and path container
        const titleContainer = document.createElement('div');
        titleContainer.className = 'flex-1';
        titleContainer.innerHTML = `
      <h4 class="text-lg font-medium text-gray-900 dark:text-white">${project.title || 'Untitled Project'}</h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 truncate">${project.path}</p>
    `;
        // Add expand button
        const expandButton = document.createElement('button');
        expandButton.className =
            'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300';
        expandButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    `;
        expandButton.addEventListener('click', () => toggleProjectContent(index));
        // Add elements to header
        projectHeader.appendChild(checkbox);
        projectHeader.appendChild(titleContainer);
        projectHeader.appendChild(expandButton);
        // Create project content preview (initially hidden)
        const projectContent = document.createElement('div');
        projectContent.className =
            'duplicate-project-content hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700';
        projectContent.id = `project-content-${index}`;
        // Format the content with proper markdown if available
        if (project.content) {
            try {
                // Use the first 500 characters for preview
                const contentPreview = project.content.substring(0, 500) +
                    (project.content.length > 500 ? '...' : '');
                // Use marked to parse markdown if available
                if (typeof marked !== 'undefined') {
                    projectContent.innerHTML = marked.parse(contentPreview);
                }
                else {
                    // Fallback to basic formatting
                    projectContent.innerHTML = `<pre class="whitespace-pre-wrap text-sm">${contentPreview}</pre>`;
                }
            }
            catch (error) {
                console.error('Error parsing project content:', error);
                projectContent.textContent =
                    project.content.substring(0, 500) +
                        (project.content.length > 500 ? '...' : '');
            }
        }
        else {
            projectContent.innerHTML =
                '<p class="text-gray-500 dark:text-gray-400 italic">No content available</p>';
        }
        // Add to project container
        projectContainer.appendChild(projectHeader);
        projectContainer.appendChild(projectContent);
        // Add to duplicate list
        console.log(`Appending project ${index} container to duplicate list`);
        duplicateList.appendChild(projectContainer);
    });
    // Update merge button state - since all are selected by default, merge should be enabled
    updateMergeButtonState();
    // Switch to the duplicates tab to make everything visible
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === 'duplicates') {
            button.click();
        }
    });
}
/**
 * Toggle project content visibility
 * @param {number} index - Index of the project in the current group
 */
function toggleProjectContent(index) {
    const contentElement = document.getElementById(`project-content-${index}`);
    if (contentElement) {
        if (contentElement.classList.contains('hidden')) {
            contentElement.classList.remove('hidden');
        }
        else {
            contentElement.classList.add('hidden');
        }
    }
}
/**
 * Update the state of the merge button based on selections
 */
function updateMergeButtonState() {
    const mergeBtn = document.getElementById('merge-duplicates-btn');
    if (mergeBtn) {
        // Enable merge button only if at least 2 projects are selected
        if (selectedProjects.size >= 2) {
            mergeBtn.disabled = false;
            mergeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        else {
            mergeBtn.disabled = true;
            mergeBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
}
/**
 * Merge selected projects
 */
async function mergeSelectedProjects() {
    if (selectedProjects.size < 2) {
        uiManager.showNotification('Please select at least 2 projects to merge', 'warning');
        return;
    }
    console.log('Merging selected projects:', Array.from(selectedProjects));
    try {
        // Get the selected projects from the current group
        const projectsToMerge = currentDuplicateGroup.filter(project => selectedProjects.has(project.path));
        console.log('Projects to merge:', projectsToMerge);
        // Add loading state to the merge button
        const mergeButton = document.getElementById('merge-duplicates-btn');
        if (mergeButton) {
            mergeButton.disabled = true;
            mergeButton.textContent = 'Merging...';
        }
        // Show confirmation dialog
        if (confirm(`Are you sure you want to merge ${projectsToMerge.length} projects? This action cannot be undone.`)) {
            // Call the backend to merge projects
            const result = await projectData.mergeProjects(projectsToMerge.map(p => p.path));
            console.log('Merge result:', result);
            if (result.success) {
                uiManager.showNotification('Projects merged successfully', 'success');
                // Move to the next duplicate group
                moveToNextDuplicateGroup();
            }
            else {
                uiManager.showNotification(`Error merging projects: ${result.message}`, 'error');
            }
        }
        // Reset button state
        if (mergeButton) {
            mergeButton.disabled = false;
            mergeButton.textContent = 'Merge Projects';
        }
    }
    catch (error) {
        console.error('Error merging projects:', error);
        uiManager.showNotification('Error merging projects: ' + error.message, 'error');
        // Reset button state
        const mergeButton = document.getElementById('merge-duplicates-btn');
        if (mergeButton) {
            mergeButton.disabled = false;
            mergeButton.textContent = 'Merge Projects';
        }
    }
}
/**
 * Skip the current duplicate group
 */
function skipDuplicateGroup() {
    console.log('Skipping duplicate group');
    uiManager.showNotification('Skipped duplicate group', 'info');
    moveToNextDuplicateGroup();
}
/**
 * Move to the next duplicate group
 */
function moveToNextDuplicateGroup() {
    // Increment index
    currentDuplicateIndex++;
    // Check if we've reached the end of the duplicate groups
    if (currentDuplicateIndex >= duplicateGroups.length) {
        console.log('Reached the end of duplicate groups');
        uiManager.showNotification('All duplicate groups reviewed', 'success');
        endDuplicateReview();
        return;
    }
    // Set the next duplicate group
    currentDuplicateGroup = duplicateGroups[currentDuplicateIndex];
    // Display the next duplicate group
    displayDuplicateGroup();
}
/**
 * End duplicate review
 */
function endDuplicateReview() {
    console.log('Ending duplicate review');
    // Reset review mode
    isReviewingDuplicates = false;
    // Hide duplicate review container
    const duplicateReviewContainer = document.getElementById('duplicate-review-container');
    if (duplicateReviewContainer) {
        duplicateReviewContainer.style.display = 'none';
    }
    // Move to the next workflow step if we're in a workflow
    try {
        if (workflowManager &&
            typeof workflowManager.getCurrentWorkflowStep === 'function' &&
            workflowManager.getCurrentWorkflowStep() ===
                workflowManager.WORKFLOW_STEPS.DUPLICATE_DETECTION) {
            workflowManager.moveToNextWorkflowStep();
        }
    }
    catch (error) {
        console.error('Error checking workflow step:', error);
    }
}
/**
 * Start duplicate detection process (for backward compatibility)
 * @returns {Promise<Object>} Result of the duplicate detection
 */
async function startDuplicateDetection() {
    console.log('startDuplicateDetection called, forwarding to handleDuplicateDetection');
    await handleDuplicateDetection();
    return { success: true };
}
// Export functions
module.exports = {
    startDuplicateDetection,
    handleDuplicateDetection,
    startDuplicateReview,
    skipDuplicateGroup,
    endDuplicateReview,
    displayDuplicateGroup,
    setupDuplicateReviewEventListeners,
    mergeSelectedProjects,
    showDuplicateReviewContainer,
    isReviewingDuplicates: () => isReviewingDuplicates,
};
//# sourceMappingURL=duplicateDetector.js.map