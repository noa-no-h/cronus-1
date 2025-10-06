/**
 * Example for testing the Hugging Face Router API implementation
 *
 * This example shows how to use the Hugging Face LLM implementation
 * with the Router API that acts as a drop-in replacement for OpenAI's API.
 *
 * Run this file with:
 * bun run src/services/categorization/debug/test-router-api.ts
 *
 * Make sure to set the HUGGINGFACE_API_KEY in your .env file
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { getHuggingFaceCategoryChoice, getHuggingFaceSummaryForBlock } from '../llm-huggingface-simplified';

// More robust .env file loading - try multiple possible locations
const envPaths = [
  path.resolve(process.cwd(), '.env'),                     // Current working directory
  path.resolve(process.cwd(), 'server', '.env'),           // server subdirectory
  path.resolve(process.cwd(), '..', '.env'),               // Parent directory
  path.resolve(__dirname, '..', '..', '..', '.env'),       // From this file up to server root
];

// Try each path until we find a .env file
let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Found .env file at: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️ No .env file found in any expected location');
}

// Hugging Face API setup check
function checkHuggingFaceSetup() {
  console.log('\n=== Hugging Face API Setup Check ===');
  
  // Check if API key is set
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const apiKeyExists = !!apiKey;
  
  console.log(`✓ HUGGINGFACE_API_KEY set: ${apiKeyExists ? 'Yes' : 'No'}`);
  
  // Check API key format
  if (apiKeyExists) {
    console.log(`✓ API key found with length: ${apiKey.length}`);
    // Log the first few characters to help with troubleshooting
    console.log(`✓ API key starts with: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);
  }
  
  console.log('=====================================\n');
  
  return apiKeyExists;
}

// Example user data
const userProjectsAndGoals = `
Finish implementing the new feature for my app
Write documentation for my project
Study for my upcoming exam
`;

const userCategories = [
  { name: 'Work', description: 'Development, coding, and work-related tasks' },
  { name: 'Learning', description: 'Studying, reading, and educational activities' },
  { name: 'Distraction', description: 'Social media, entertainment, and non-productive activities' },
];

// Import type to match the exact structure required
// Adjusted path because this file lives in server/src/services/categorization/debug/
import type { ActiveWindowDetails } from '../../../../../shared/types';

// Example activity details
const activityDetails: Pick<
  ActiveWindowDetails,
  'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
> = {
  ownerName: 'Visual Studio Code',
  title: 'llm-huggingface.ts - cronus2 - Visual Studio Code',
  url: '',
  content: 'import OpenAI from \'openai\';\nimport { ChatCompletionMessageParam } from \'openai/resources/chat/completions\';\nimport { z } from \'zod\';\nimport { ActiveWindowDetails, Category as CategoryType } from \'../../../../shared/types\';\nimport { tokenTracker } from \'../tracking/tokenUsageTracker\';\n\n// LLM Models configuration\ninterface ModelConfig {\n  provider: string;\n  modelName: string;\n}\n\n// Configure Hugging Face client using the OpenAI SDK\nconst huggingFaceClient = new OpenAI({\n  baseURL: \'https://router.huggingface.co/v1\',\n  apiKey: process.env.HUGGINGFACE_API_KEY || \'\',\n  defaultHeaders: {\n    \'User-Agent\': \'Cronus Productivity Tracker\',\n  },\n});',
  type: 'window',
  browser: null,
};

async function testRouterAPI() {
  console.log('🚀 Testing Hugging Face Router API implementation...');

  try {
    console.log('👉 Categorizing activity...');
    const categoryResult = await getHuggingFaceCategoryChoice(
      userProjectsAndGoals,
      userCategories,
      activityDetails
    );

    if (categoryResult) {
      console.log('✅ Success! Category choice result:');
      console.log(JSON.stringify(categoryResult, null, 2));
    } else {
      console.error('❌ Error: Failed to get category choice');
    }

    // Test getting a summary
    console.log('\n👉 Getting summary...');
    const summary = await getHuggingFaceSummaryForBlock(activityDetails);
    console.log('✅ Summary result:');
    console.log(summary);
  } catch (error) {
    console.error('❌ Error occurred during test:');
    console.error(error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  console.log('=== Starting Hugging Face Router API Test ===\n');
  
  // Run setup check
  const isHuggingFaceReady = checkHuggingFaceSetup();
  
  if (!isHuggingFaceReady) {
    console.error('\n⚠️ Hugging Face API setup is incomplete!');
    console.error('Please check the following:');
    console.error('1. Create a Hugging Face account at https://huggingface.co/');
    console.error('2. Get your API key from https://huggingface.co/settings/tokens');
    console.error('3. Add HUGGINGFACE_API_KEY=your_key_here to your .env file');
    console.error('\nThe test will continue, but functionality may fail.\n');
  }
  
  console.log('Running Router API test...\n');
  testRouterAPI()
    .then(() => {
      console.log('\n=== Test Complete ===');
    })
    .catch((error) => {
      console.error('\n⚠️ Test failed with error:');
      console.error(error);
      console.error('\nPlease check your API key and network connection.');
    });
}

export { testRouterAPI };
/**
 * Moved debug/test file: test-router-api.ts
 * Original purpose: manual test for the Hugging Face Router API implementation
 */

export {};
