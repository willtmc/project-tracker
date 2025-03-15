// Test script for duplicate detection - test both API and non-API functions
require('dotenv').config(); // Load environment variables from .env file

// Print the OpenAI API key status
console.log(
  'OpenAI API Key status:',
  process.env.OPENAI_API_KEY
    ? 'Present (length: ' + process.env.OPENAI_API_KEY.length + ')'
    : 'Missing'
);

// Import the DuplicateDetector from the correct path
const {
  DuplicateDetector,
} = require('./src/utils/duplicate/duplicateDetector');

// Create a fallback mock if needed
const mockOpenAI = {
  chat: {
    completions: {
      create: async () => ({
        choices: [{ message: { content: '[[0, 1]]' } }],
      }),
    },
  },
};

// Import the SimilarityChecker directly since we need to test it
const {
  SimilarityChecker,
} = require('./src/utils/duplicate/similarityChecker');

// Test the basic text similarity function directly (doesn't require OpenAI API)
async function testBasicSimilarity() {
  console.log('Testing basic text similarity function...');
  const similarityChecker = new SimilarityChecker();

  // Test similar titles
  const similar1 = similarityChecker.checkBasicTextSimilarity(
    { title: 'Website Redesign' },
    { title: 'Redesign Website' }
  );
  console.log('Similar titles test result:', similar1);

  // Test different titles
  const similar2 = similarityChecker.checkBasicTextSimilarity(
    { title: 'Website Redesign' },
    { title: 'Marketing Campaign' }
  );
  console.log('Different titles test result:', similar2);

  // Test keyword extraction
  const keywords = similarityChecker.extractKeywords(
    'Website Redesign Project for Client'
  );
  console.log('Extracted keywords:', keywords);

  // Calculate similarity manually
  const commonKeywords = similarityChecker
    .extractKeywords('Website Redesign')
    .filter(keyword =>
      similarityChecker.extractKeywords('Redesign Website').includes(keyword)
    );
  const similarity = commonKeywords.length > 0;
  console.log('Common keywords found:', similarity);

  return { similar1, similar2, keywords, similarity };
}

// Test the full duplicate detection with OpenAI API
async function testFullDuplicateDetection() {
  console.log('\nTesting full duplicate detection with OpenAI API...');
  const detector = new DuplicateDetector();

  // Create some test projects
  const testProjects = [
    {
      title: 'Website Redesign Project',
      content: 'Redesign the company website',
      path: '/test/project1.txt',
    },
    {
      title: 'Web Site Update',
      content: 'Update the company web site',
      path: '/test/project2.txt',
    },
    {
      title: 'Marketing Campaign',
      content: 'Create a new marketing campaign',
      path: '/test/project3.txt',
    },
    {
      title: 'New Marketing Strategy',
      content: 'Develop a new marketing strategy',
      path: '/test/project4.txt',
    },
  ];

  try {
    console.log('Calling findPotentialDuplicates with test data...');
    const result = await detector.findPotentialDuplicates(testProjects);
    console.log('Result from findPotentialDuplicates:', result);
    return {
      success: Array.isArray(result) && result.length > 0,
      result,
    };
  } catch (error) {
    console.error('Error in full duplicate detection test:', error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

// Run the tests sequentially
async function runAllTests() {
  try {
    // Run basic similarity test
    const basicResults = await testBasicSimilarity();

    console.log('\nBasic Similarity Test Results:');
    console.log('Similar titles detected correctly:', basicResults.similar1);
    console.log(
      'Different titles correctly not matched:',
      !basicResults.similar2
    );
    console.log(
      'Keyword extraction working:',
      basicResults.keywords.length > 0
    );
    console.log(
      'String similarity calculation working:',
      basicResults.similarity > 0
    );

    // Run full duplicate detection test with API
    const apiResults = await testFullDuplicateDetection();

    console.log('\nAPI Test Results:');
    console.log('API test successful:', apiResults.success);

    // Overall test result
    const basicTestsPassed =
      basicResults.similar1 &&
      !basicResults.similar2 &&
      basicResults.keywords.length > 0 &&
      basicResults.similarity > 0;

    console.log('\nOverall test results:');
    console.log(
      'Basic similarity tests:',
      basicTestsPassed ? 'PASSED' : 'FAILED'
    );
    console.log('OpenAI API tests:', apiResults.success ? 'PASSED' : 'FAILED');

    const allTestsPassed = basicTestsPassed && apiResults.success;
    console.log(
      '\nFinal verdict:',
      allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'
    );

    if (allTestsPassed) {
      console.log('The duplicate detection feature is working correctly!');
    } else {
      console.log(
        'Some tests failed. The duplicate detection feature may not be working correctly.'
      );
      if (!apiResults.success) {
        console.log(
          'API test failed. This suggests an issue with the OpenAI API integration.'
        );
        console.log(
          'Check your API key and ensure it has the correct permissions.'
        );
      }
    }
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run all tests
runAllTests();
