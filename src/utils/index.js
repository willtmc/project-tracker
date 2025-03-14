// Export all utilities from a single entry point
const { ProjectManager } = require('./project/projectManager');
const { DuplicateDetector } = require('./duplicate/duplicateDetector');

module.exports = {
  ProjectManager,
  DuplicateDetector
};
