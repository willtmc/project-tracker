// Keyboard shortcuts module
const projectData = require('../projectData');
const uiManager = require('../uiManager');
const reviewManager = require('../reviewManager');

/**
 * Handle keyboard shortcuts during review mode
 * @param {KeyboardEvent} event The keyboard event
 */
function handleReviewKeydown(event) {
  // Only process if we're in review mode
  if (!reviewManager.isReviewMode()) {
    return;
  }

  console.log(`Review keydown: ${event.key}`);

  // Get the current project being reviewed
  const currentProject = reviewManager.getCurrentReviewProject();
  if (!currentProject) {
    console.error('No current project to review');
    uiManager.showNotification('No project to review', 'error');
    return;
  }

  switch (event.key.toLowerCase()) {
    case 'y': // Yes - keep project active
      console.log('Keeping project active');
      uiManager.showNotification(
        `Keeping "${currentProject.title}"`,
        'success'
      );
      reviewManager.moveToNextProject();
      break;

    case 'a': // Archive project
      console.log('Archiving project');
      projectData
        .updateProjectStatus(currentProject, 'archive')
        .then(() => {
          uiManager.showNotification(
            `Archived "${currentProject.title}"`,
            'success'
          );
          reviewManager.moveToNextProject();
        })
        .catch(error => {
          console.error('Error archiving project:', error);
          uiManager.showNotification(
            `Error archiving project: ${error.message}`,
            'error'
          );
        });
      break;

    case 's': // Someday project
      console.log('Moving project to someday');
      projectData
        .updateProjectStatus(currentProject, 'someday')
        .then(() => {
          uiManager.showNotification(
            `Moved "${currentProject.title}" to someday`,
            'success'
          );
          reviewManager.moveToNextProject();
        })
        .catch(error => {
          console.error('Error moving project to someday:', error);
          uiManager.showNotification(
            `Error moving project to someday: ${error.message}`,
            'error'
          );
        });
      break;

    case 'w': // Waiting for input
      console.log('Moving project to waiting');
      // Show waiting input dialog
      reviewManager.showWaitingInputDialog(currentProject);
      break;

    case 'escape': // Cancel review
      console.log('Canceling review');
      reviewManager.cancelReview();
      break;

    default:
      // Ignore other keys
      break;
  }
}

/**
 * Set up keyboard shortcut event listeners
 */
function setupKeyboardShortcuts() {
  console.log('Setting up keyboard shortcuts');

  // Set up global keydown listener
  document.addEventListener('keydown', event => {
    // Handle review mode shortcuts
    handleReviewKeydown(event);
  });

  console.log('Keyboard shortcuts set up');
}

module.exports = {
  handleReviewKeydown,
  setupKeyboardShortcuts,
};
