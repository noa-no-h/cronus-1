import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Initialize environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Get API key from environment or use a placeholder for testing
// Replace this with your actual API key when running the script
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'YOUR_API_KEY_HERE';
if (apiKey === 'YOUR_API_KEY_HERE') {
  console.warn('WARNING: Using placeholder API key. Replace with your actual Gemini API key.');
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(apiKey);

// List available models using direct API call
async function listAvailableModels() {
  try {
    console.log('Fetching available models...');
    
    // Make direct API call to list models since the SDK doesn't expose this method
    const response = await axios.get('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const models = response.data.models || [];
    
    console.log('\nAVAILABLE MODELS:');
    console.log('=================');
    
    models.forEach((model: any) => {
      console.log(`- Name: ${model.name}`);
      console.log(`  Display Name: ${model.displayName || 'N/A'}`);
      console.log(`  Description: ${model.description || 'N/A'}`);
      console.log(`  Supported Generation Methods:`);
      if (model.supportedGenerationMethods && model.supportedGenerationMethods.length > 0) {
        model.supportedGenerationMethods.forEach((method: string) => {
          console.log(`    - ${method}`);
        });
      } else {
        console.log('    - None specified');
      }
      console.log('');
    });
    
    console.log('Total models available:', models.length);
  } catch (error) {
    console.error('Error fetching models:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Execute the function
listAvailableModels();

// Execute the function
listAvailableModels();