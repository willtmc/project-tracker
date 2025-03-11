// Main event handler module
const projectEvents = require('./projectEvents');
const keyboardShortcuts = require('./keyboardShortcuts');
const tabManager = require('../tabManager');
const reviewManager = require('../reviewManager');

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  console.log('Setting up event listeners');
  
  // Set up tab event listeners
  tabManager.setupTabEventListeners();
  
  // Set up review event listeners
  reviewManager.setupReviewEventListeners();
  
  // Set up project event listeners
  projectEvents.setupProjectEventListeners();
  
  // Set up keyboard shortcuts
  keyboardShortcuts.setupKeyboardShortcuts();
  
  // Set up refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      console.log('Refresh button clicked');
      const renderer = require('../../renderer-new');
      await renderer.loadAndRenderProjects();
    });
  }
  
  console.log('Event listeners set up');
}

module.exports = {
  setupEventListeners
};
