// Test script for OpenAI API
require('dotenv').config();
const { OpenAI } = require('openai');

async function testOpenAI() {
  try {
    console.log(
      'OPENAI_API_KEY=',
      process.env.OPENAI_API_KEY ? 'Present' : 'Missing'
    );

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test a simple completion
    console.log('Testing OpenAI API...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Hello world',
        },
      ],
    });

    console.log('Response received:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('Error testing OpenAI API:', error);
    return false;
  }
}

testOpenAI()
  .then(success => {
    console.log('Test result:', success ? 'SUCCESS' : 'FAILED');
  })
  .catch(error => {
    console.error('Error running test:', error);
  });
