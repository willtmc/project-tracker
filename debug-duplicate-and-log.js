// Debug script for duplicate detection with detailed logging
require('dotenv').config();
const fs = require('fs');
const { EOL } = require('os');

// Import the ProjectManager
const { ProjectManager } = require('./src/utils');
const { DuplicateDetector } = require('./src/utils/duplicateDetector');

// Create a log file stream
const logFile = fs.createWriteStream('duplicate-debug.log', { flags: 'w' });

// Override console.log to write to file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function () {
  const args = Array.from(arguments);
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
    .join(' ');

  logFile.write(`[LOG] ${message}\n`);
  originalConsoleLog.apply(console, arguments);
};

console.error = function () {
  const args = Array.from(arguments);
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg))
    .join(' ');

  logFile.write(`[ERROR] ${message}\n`);
  originalConsoleError.apply(console, arguments);
};

// Function to log with timestamp
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${EOL}`;
  console.log(logMessage.trim());
  logFile.write(logMessage);
}

async function testDuplicateDetection() {
  try {
    logWithTimestamp('-------------- STARTING DETAILED DUPLICATE DETECTION TEST --------------');
    logWithTimestamp('Creating ProjectManager instance...');
    const projectManager = new ProjectManager();

    logWithTimestamp('Calling findPotentialDuplicates()...');
    const result = await projectManager.findPotentialDuplicates();

    logWithTimestamp('\nResult from findPotentialDuplicates:');
    logWithTimestamp(JSON.stringify(result, null, 2));

    if (result.success && result.duplicateGroups) {
      logWithTimestamp(`Found ${result.duplicateGroups.length} duplicate groups`);

      // Examine the structure of each group
      result.duplicateGroups.forEach((group, index) => {
        logWithTimestamp(`\nGroup ${index + 1}:`);
        logWithTimestamp(`  Type: ${typeof group}`);
        logWithTimestamp(`  Is Array: ${Array.isArray(group)}`);
        logWithTimestamp(`  Length: ${group ? group.length : 'undefined'}`);

        if (Array.isArray(group) && group.length > 0) {
          group.forEach((project, pIndex) => {
            logWithTimestamp(`  Project ${pIndex + 1}:`);
            logWithTimestamp(`    Title: ${project.title || 'No title'}`);
            logWithTimestamp(`    Path: ${project.path || 'No path'}`);
            logWithTimestamp(`    Has content: ${!!project.content}`);
            logWithTimestamp(
              `    Content length: ${project.content ? project.content.length : 0}`
            );
          });
        } else {
          logWithTimestamp('  Invalid group structure');
        }
      });
    }

    return result;
  } catch (error) {
    logWithTimestamp('Critical error in duplicate detection test:', error);
    return { success: false, error: error.toString() };
  }
}

// Also test the OpenAI service directly
async function testOpenAI() {
  try {
    logWithTimestamp('\n-------------- TESTING OPENAI SERVICE DIRECTLY --------------');
    const detector = new DuplicateDetector();

    // Create test projects
    const testProjects = [
      {
        title: 'Test Project A - Website Redesign',
        content: 'Update the company website with new branding',
        path: '/path/to/project-a.txt',
      },
      {
        title: 'Test Project B - Website Update',
        content: 'Refresh website with new logo and colors',
        path: '/path/to/project-b.txt',
      },
    ];

    logWithTimestamp(`Testing with ${testProjects.length} test projects`);

    const groups = await detector.findPotentialDuplicates(testProjects);
    logWithTimestamp('OpenAI test result:', JSON.stringify(groups, null, 2));

    return { success: true, groups };
  } catch (error) {
    logWithTimestamp('Error in OpenAI test:', error);
    return { success: false, error: error.toString() };
  }
}

// Run tests and log results
async function runAllTests() {
  try {
    const duplicateResult = await testDuplicateDetection();
    logWithTimestamp('\nDuplicate detection test completed. Success:', duplicateResult.success);

    const openaiResult = await testOpenAI();
    logWithTimestamp('\nOpenAI test completed. Success:', openaiResult.success);

    logWithTimestamp('\n-------------- ALL TESTS COMPLETED --------------');
    logWithTimestamp('See duplicate-debug.log for full details');

    // Close the log file
    logFile.end();
  } catch (error) {
    logWithTimestamp('Fatal error in tests:', error);
    logFile.end();
  }
}

runAllTests();
