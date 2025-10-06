/**
 * Debug script for checking Router API authentication
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';

// Load environment variables from more locations
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
  path.resolve(__dirname, '..', '..', '..', '.env'),
];

// Try each path
let envPath = '';
for (const path of envPaths) {
  if (fs.existsSync(path)) {
    envPath = path;
    console.log(`Loading .env from: ${path}`);
    dotenv.config({ path });
    break;
  }
}

if (!envPath) {
  console.error('No .env file found!');
  process.exit(1);
}

// Show API key details (partial for security)
const apiKey = process.env.HUGGINGFACE_API_KEY || '';
console.log(`API key exists: ${!!apiKey}`);
console.log(`API key length: ${apiKey.length}`);
console.log(`First few chars: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

// Create OpenAI client with Router API
const client = new OpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: apiKey,
});

// Test function
async function testAuthentication() {
  try {
    console.log('Attempting to call Chat API with Meta-Llama model...');
    const response = await client.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      messages: [{ role: 'user', content: 'Hello, what is 2+2?' }],
      max_tokens: 10,
    });
    
    console.log('Success! Response:');
    console.log(JSON.stringify(response.choices[0], null, 2));
    return true;
  } catch (error) {
    console.error('Error calling API:');
    console.error(error);
    
    // Try with explicit Authorization header
    console.log('\nTrying with explicit Authorization header...');
    
    try {
      const clientWithAuth = new OpenAI({
        baseURL: 'https://router.huggingface.co/v1',
        apiKey: apiKey,
        defaultHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      const response = await clientWithAuth.chat.completions.create({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        messages: [{ role: 'user', content: 'Hello, what is 2+2?' }],
        max_tokens: 10,
      });
      
      console.log('Success with explicit Authorization! Response:');
      console.log(JSON.stringify(response.choices[0], null, 2));
      return true;
    } catch (authError) {
      console.error('Error with explicit Authorization:');
      console.error(authError);
      return false;
    }
  }
}

// Run the test
testAuthentication()
  .then(success => {
    if (success) {
      console.log('\n✅ Authentication successful!');
    } else {
      console.error('\n❌ Authentication failed!');
      console.log('\nPossible issues:');
      console.log('1. API key is incorrect or expired');
      console.log('2. You don\'t have access to the requested models');
      console.log('3. Router API configuration has changed');
    }
  })
  .catch(console.error);
