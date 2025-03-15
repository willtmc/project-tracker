// Test script for duplicate detector
require('dotenv').config();
const { DuplicateDetector } = require('./src/utils/duplicateDetector');

async function testDuplicateDetector() {
  try {
    console.log('Testing DuplicateDetector directly...');

    // Create test projects
    const testProjects = [
      {
        title: 'Project A - Website Redesign',
        content: 'Update the company website with new branding',
        path: '/path/to/project-a.txt',
      },
      {
        title: 'Project B - Website Update',
        content: 'Refresh website with new logo and colors',
        path: '/path/to/project-b.txt',
      },
      {
        title: 'Project C - Email Marketing Campaign',
        content: 'Create a series of marketing emails',
        path: '/path/to/project-c.txt',
      },
      {
        title: 'Project D - Social Media Strategy',
        content: 'Develop a comprehensive social media plan',
        path: '/path/to/project-d.txt',
      },
    ];

    console.log(`Created ${testProjects.length} test projects`);

    // Initialize the duplicate detector
    console.log('Initializing DuplicateDetector...');
    const duplicateDetector = new DuplicateDetector();

    // Find potential duplicates
    console.log('Calling findPotentialDuplicates directly...');
    const duplicateGroups =
      await duplicateDetector.findPotentialDuplicates(testProjects);

    console.log('Results from findPotentialDuplicates:');
    console.log('Type of result:', typeof duplicateGroups);
    console.log('Is array:', Array.isArray(duplicateGroups));
    console.log('Number of duplicate groups:', duplicateGroups.length);

    if (duplicateGroups.length > 0) {
      console.log('Duplicate groups found:');
      duplicateGroups.forEach((group, index) => {
        console.log(`Group ${index + 1}:`);
        group.forEach(project => {
          console.log(`- ${project.title}`);
        });
      });
    } else {
      console.log('No duplicate groups found');
    }

    return {
      success: true,
      duplicateGroups,
    };
  } catch (error) {
    console.error('Error in duplicate detector test:', error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

// Run test and log results
testDuplicateDetector()
  .then(result => {
    console.log('\nTest completed. Success:', result.success);
    console.log('Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Fatal error in test:', error);
  });
