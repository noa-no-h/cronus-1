import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

// Initialize environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Get API key from environment or use a placeholder for testing
// Replace this with your actual API key when running the script
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'YOUR_API_KEY_HERE';
if (apiKey === 'YOUR_API_KEY_HERE') {
  console.warn('WARNING: Using placeholder API key. Replace with your actual Gemini API key.');
}

// Various base URLs to try for OpenAI compatibility
const baseURLs = [
  "https://generativelanguage.googleapis.com/v1/",
  "https://generativelanguage.googleapis.com/v1beta/",
  "https://generativelanguage.googleapis.com/v1/openai/",
  "https://generativelanguage.googleapis.com/v1beta/openai/"
];

// Various model names to try
const modelNames = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-pro',
  'gemini-flash',
  'gemini-1.0-pro',
  'models/gemini-1.5-pro',
  'models/gemini-1.5-flash',
  'gpt-3.5-turbo'
];

async function testModelAccess() {
  for (const baseURL of baseURLs) {
    console.log(`\nTesting base URL: ${baseURL}`);
    
    // Initialize the OpenAI client with the current baseURL
    const client = new OpenAI({
      apiKey,
      baseURL
    });
    
    // Try each model name
    for (const model of modelNames) {
      try {
        console.log(`\nTrying model: ${model}`);
        
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Say hello!" }
          ],
          temperature: 0.2,
          max_tokens: 50,
        });
        
        console.log(`SUCCESS with ${model} at ${baseURL}`);
        console.log(`Response: ${completion.choices[0].message.content}`);
      } catch (error: any) {
        console.error(`FAILED with ${model} at ${baseURL}: ${error.message || error}`);
      }
    }
  }
}

// Run the tests
testModelAccess().catch(error => {
  console.error('Error during testing:', error);
});