// Script to force duplicate detection to return known duplicates
require('dotenv').config();
const path = require('path');

// Force known duplicates for testing
async function forceDuplicates() {
  try {
    console.log('Starting force duplicates test...');

    // Create a mock function to replace the OpenAI call
    const {
      DuplicateDetector,
    } = require('./src/utils/duplicate/duplicateDetector');

    // Save the original OpenAI call function
    const originalPrototype = DuplicateDetector.prototype;
    const originalFind = originalPrototype.findPotentialDuplicates;

    // Override the function to return known duplicates
    DuplicateDetector.prototype.findPotentialDuplicates = async function (
      activeProjects
    ) {
      console.log('MOCK: Force returning test duplicate groups!');

      // Log the real projects for reference
      console.log(`Real active projects: ${activeProjects.length}`);

      // Create sample duplicate groups with the real project data
      // Use first 3 projects as one group, next 2 as another group
      const fakeGroups = [];

      if (activeProjects.length >= 3) {
        fakeGroups.push(activeProjects.slice(0, 3));
      }

      if (activeProjects.length >= 5) {
        fakeGroups.push(activeProjects.slice(3, 5));
      }

      // Add some more fake groups
      if (activeProjects.length >= 8) {
        fakeGroups.push(activeProjects.slice(5, 8));
      }

      console.log(`Created ${fakeGroups.length} fake duplicate groups`);
      fakeGroups.forEach((group, i) => {
        console.log(
          `Group ${i + 1}:`,
          group.map(p => p.title)
        );
      });

      return fakeGroups;
    };

    console.log('Mocked duplicate detector findPotentialDuplicates method');

    // Now run the test with our mock
    const { ProjectManager } = require('./src/utils');
    const projectManager = new ProjectManager();

    console.log('Calling findPotentialDuplicates to get our fake groups...');
    const result = await projectManager.findPotentialDuplicates();

    console.log('\nResult from findPotentialDuplicates:');
    console.log('Success:', result.success);
    console.log(
      'Duplicate groups:',
      result.duplicateGroups ? result.duplicateGroups.length : 'none'
    );

    // Restore the original function
    DuplicateDetector.prototype.findPotentialDuplicates = originalFind;
    console.log('Restored original duplicate detector method');

    return result;
  } catch (error) {
    console.error('Error in force duplicates test:', error);
    return { success: false, error: error.toString() };
  }
}

// Run test
forceDuplicates()
  .then(result => {
    console.log(
      '\nTest completed. Result:',
      result.success ? 'SUCCESS' : 'FAILURE'
    );
    if (result.success && result.duplicateGroups) {
      console.log(
        `Found ${result.duplicateGroups.length} forced duplicate groups`
      );
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
  });
