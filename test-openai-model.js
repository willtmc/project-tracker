// Test script for OpenAI API with model name used in the app
require('dotenv').config();
const { OpenAI } = require('openai');

async function testOpenAIModel() {
  try {
    console.log(
      'OPENAI_API_KEY=',
      process.env.OPENAI_API_KEY ? 'Present' : 'Missing'
    );

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Try the exact model name used in the app
    const modelName = 'chatgpt-4o-latest';
    console.log(`Testing OpenAI API with model: ${modelName}`);

    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content:
              'You are a specialized assistant that identifies groups of potentially duplicate or related project titles.',
          },
          {
            role: 'user',
            content:
              'Please identify groups of related project titles from the following list:\n\n0: Test Project A\n1: Test Project B',
          },
        ],
      });

      console.log('Response received:', response.choices[0].message.content);
      return { success: true, model: modelName };
    } catch (modelError) {
      console.error(`Error with model ${modelName}:`, modelError);

      // Try with standard gpt-4o as fallback
      console.log('Trying with standard gpt-4o model as fallback...');
      const fallbackModel = 'gpt-4o';

      const fallbackResponse = await openai.chat.completions.create({
        model: fallbackModel,
        messages: [
          {
            role: 'system',
            content:
              'You are a specialized assistant that identifies groups of potentially duplicate or related project titles.',
          },
          {
            role: 'user',
            content:
              'Please identify groups of related project titles from the following list:\n\n0: Test Project A\n1: Test Project B',
          },
        ],
      });

      console.log(
        'Fallback response received:',
        fallbackResponse.choices[0].message.content
      );
      return {
        success: true,
        model: fallbackModel,
        originalModelError: modelError.message,
      };
    }
  } catch (error) {
    console.error('Error testing OpenAI API:', error);
    return { success: false, error: error.message };
  }
}

testOpenAIModel()
  .then(result => {
    console.log('\nTest result:', result);
  })
  .catch(error => {
    console.error('Error running test:', error);
  });
