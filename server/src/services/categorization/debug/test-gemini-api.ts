/**
 * Test file for verifying the Gemini API integration
 * 
 * This is a simple script to test if the Gemini integration works.
 * It tests the basic functionality by making a category choice call.
 */

import { getCategoryChoice } from '../llm-impl';

async function testGeminiIntegration() {
  console.log('=== Testing Gemini API Integration ===');
  
  // Check if API key is set
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY not set in environment.');
    console.log('Please set the GEMINI_API_KEY environment variable and try again.');
    process.exit(1);
  }
  
  // Sample data for testing
  const userProjectsAndGoals = 'Working on a React project. Learning TypeScript.';
  
  const userCategories = [
    { name: 'Deep Work', description: 'Focused work on important projects' },
    { name: 'Learning', description: 'Learning new skills and knowledge' },
    { name: 'Distraction', description: 'Non-productive activities' },
  ];
  
  const activityDetails = {
    ownerName: 'VS Code',
    title: 'index.tsx - React Project',
    content: 'import React from "react";\n\nfunction App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;',
    type: 'editor',
  };
  
  console.log('Making API call to Gemini...');
  
  try {
    const result = await getCategoryChoice(userProjectsAndGoals, userCategories, activityDetails);
    type ChoiceResult = { categoryName: string; summary: string; reasoning: string };
    const safeResult = (result && typeof result === 'object' && 'categoryName' in result && 'summary' in result && 'reasoning' in result)
      ? (result as ChoiceResult)
      : { categoryName: '', summary: '', reasoning: '' };

    console.log('=== API Call Successful ===');
    console.log('Chosen Category:', safeResult.categoryName);
    console.log('Summary:', safeResult.summary);
    console.log('Reasoning:', safeResult.reasoning);
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('=== API Call Failed ===');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the test
testGeminiIntegration();