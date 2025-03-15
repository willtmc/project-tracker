// Export all utilities from a single entry point
const { ProjectManager } = require('./project/projectManager');
const { DuplicateDetector } = require('./duplicateDetector');

module.exports = {
  ProjectManager,
  DuplicateDetector,
};
