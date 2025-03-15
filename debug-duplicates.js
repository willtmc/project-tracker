// Debug script for duplicate detection handler
require('dotenv').config();
const path = require('path');

// Import the ProjectManager
const { ProjectManager } = require('./src/utils');

async function testDuplicateDetection() {
  try {
    console.log('Creating ProjectManager instance...');
    const projectManager = new ProjectManager();

    console.log('Calling findPotentialDuplicates()...');
    const result = await projectManager.findPotentialDuplicates();

    console.log('\nResult from findPotentialDuplicates:');
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Error in duplicate detection test:', error);
    return { success: false, error: error.toString() };
  }
}

// Run test and log results
testDuplicateDetection()
  .then(result => {
    console.log('\nTest completed. Success:', result.success);
    if (result.success) {
      console.log(`Found ${result.duplicateGroups.length} duplicate groups`);
    } else {
      console.log('Error:', result.message || 'Unknown error');
    }
  })
  .catch(error => {
    console.error('Fatal error in test:', error);
  });
