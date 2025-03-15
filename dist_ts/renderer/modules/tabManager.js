"use strict";
// Tab management module
// Current active tab
let currentTab = 'active';
/**
 * Setup tabs functionality
 */
function setupTabs() {
    console.log('Setting up tabs');
    // Get all tab buttons and panes
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    // Hide all tab panes initially
    tabPanes.forEach(pane => {
        pane.style.display = 'none';
    });
    // Show the active tab (default to active tab)
    const activeTab = document.getElementById('active-tab');
    if (activeTab) {
        activeTab.style.display = 'block';
    }
    // Add active class to the active tab button
    const activeTabButton = document.querySelector('.tab-btn[data-tab="active"]');
    if (activeTabButton) {
        activeTabButton.classList.add('active');
    }
    console.log('Tabs setup complete');
}
/**
 * Switch between tabs
 * @param {string} tabName The tab to switch to
 */
async function switchTab(tabName) {
    console.log(`Switching to ${tabName} tab`);
    currentTab = tabName;
    // Get all tab buttons and panes
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    // Hide all tab panes
    tabPanes.forEach(pane => {
        pane.style.display = 'none';
    });
    // Remove active class from all tab buttons
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    // Show the selected tab pane
    const selectedPane = document.getElementById(`${tabName}-tab`);
    if (selectedPane) {
        selectedPane.style.display = 'block';
    }
    else {
        console.error(`Tab pane for ${tabName} not found`);
    }
    // Add active class to the selected tab button
    const selectedButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    else {
        console.error(`Tab button for ${tabName} not found`);
    }
    // Special handling for different tabs
    if (tabName === 'review') {
        // Initialize review elements when switching to review tab
        const reviewModule = require('./reviewManager');
        reviewModule.initializeReviewElements();
    }
    else if (tabName === 'report') {
        // Generate report when switching to report tab
        const reportModule = require('./reportManager');
        reportModule.generateReport();
    }
    else if (tabName === 'well-formulation') {
        // Handle well-formulation tab
        console.log('Handling well-formulation tab');
    }
    else if (tabName === 'duplicates') {
        // Handle duplicates tab
        console.log('Handling duplicates tab');
        // Reset the duplicate review container to hidden state
        const duplicateReviewContainer = document.getElementById('duplicate-review-container');
        if (duplicateReviewContainer) {
            duplicateReviewContainer.style.display = 'none';
        }
        // Reset the duplicates count
        const duplicatesCount = document.getElementById('duplicates-count');
        if (duplicatesCount) {
            duplicatesCount.textContent = '0';
        }
    }
    console.log(`Switched to ${tabName} tab`);
}
/**
 * Get the current active tab
 * @returns {string} The current tab name
 */
function getCurrentTab() {
    return currentTab;
}
/**
 * Setup event listeners for tabs
 */
function setupTabEventListeners() {
    // Get tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    console.log('Tab event listeners set up');
}
module.exports = {
    setupTabs,
    switchTab,
    getCurrentTab,
    setupTabEventListeners,
};
//# sourceMappingURL=tabManager.js.map