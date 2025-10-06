import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { setLLMProvider, getCategoryChoice, getSummaryForBlock } from './llm-provider';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Hugging Face API setup check
function checkHuggingFaceSetup() {
  console.log('\n=== Hugging Face API Setup Check ===');
  
  // Check if .env file exists
  const envPath = path.resolve(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  
  console.log(`✓ .env file exists: ${envExists ? 'Yes' : 'No'}`);
  
  // Check if API key is set
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const apiKeyExists = !!apiKey;
  
  console.log(`✓ HUGGINGFACE_API_KEY set: ${apiKeyExists ? 'Yes' : 'No'}`);
  if (apiKeyExists) {
    console.log(`✓ API key format check: ${apiKey.startsWith('hf_') ? 'Valid' : 'Invalid - should start with "hf_"'}`);
  }
  
  console.log('=====================================\n');
  
  return apiKeyExists;
}

// Example activity details
const exampleActivity = {
  ownerName: 'Visual Studio Code',
  title: 'Working on Cronus Project - llm.ts',
  url: null,
  content: 'Example content about productivity tracking software',
  type: 'window' as 'window' | 'browser' | 'system' | 'manual' | 'calendar',
  browser: null
};

// Example user projects/goals
const userProjectsAndGoals = 'Develop productivity tracking software and improve AI integrations';

// Example user categories
const userCategories = [
  { name: 'Work', description: 'Tasks related to my main job' },
  { name: 'Development', description: 'Software development on personal projects' },
  { name: 'Distraction', description: 'Activities that take away from productivity' }
];

/**
 * Example of using the LLM provider with both OpenAI and Hugging Face implementations
 */
async function testLLMImplementations() {
  try {
    // Test with OpenAI implementation (default)
    console.log('Testing with OpenAI implementation...');
    const openaiCategoryChoice = await getCategoryChoice(
      userProjectsAndGoals,
      userCategories,
      exampleActivity
    );
    console.log('OpenAI Category Choice:', openaiCategoryChoice);
    
    // Switch to Hugging Face implementation
    setLLMProvider('huggingface');
    console.log('\nTesting with Hugging Face implementation...');
    const huggingfaceCategoryChoice = await getCategoryChoice(
      userProjectsAndGoals,
      userCategories,
      exampleActivity
    );
    console.log('Hugging Face Category Choice:', huggingfaceCategoryChoice);
    
    // Test getting a summary with Hugging Face
    console.log('\nGetting summary with Hugging Face...');
    const summary = await getSummaryForBlock(exampleActivity);
    console.log('Summary:', summary);
    
  } catch (error) {
    console.error('Error testing LLM implementations:', error);
  }
}

// Run the test function if this file is executed directly
if (require.main === module) {
  console.log('=== Starting LLM Implementation Test ===\n');
  
  // Run setup check
  const isHuggingFaceReady = checkHuggingFaceSetup();
  
  if (!isHuggingFaceReady) {
    console.error('\n⚠️ Hugging Face API setup is incomplete!');
    console.error('Please check the following:');
    console.error('1. Create a Hugging Face account at https://huggingface.co/');
    console.error('2. Get your API key from https://huggingface.co/settings/tokens');
    console.error('3. Add HUGGINGFACE_API_KEY=hf_your_key_here to your server/.env file');
    console.error('\nThe test will continue, but Hugging Face functionality may fail.\n');
  }
  
  console.log('Running test implementations...\n');
  testLLMImplementations()
    .then(() => {
      console.log('\n=== Test Complete ===');
    })
    .catch((error) => {
      console.error('\n⚠️ Test failed with error:');
      console.error(error);
      console.error('\nPlease check your API keys and network connection.');
    });
}

export { testLLMImplementations };