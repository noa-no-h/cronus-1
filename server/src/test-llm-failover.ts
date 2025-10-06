// Test script to verify LLM failover mechanism
import dotenv from 'dotenv';
dotenv.config();

import { getCategoryChoice, getEmoji } from './services/categorization/llm-impl';
import { ActiveWindowDetails, Category } from '../../shared/types';

async function testLLMFailover() {
  console.log('Testing LLM failover mechanism with high-quality models...');
  
  // Mock data
  const userProjectsAndGoals = 'Building a productivity app to track and categorize user activities';
  
  const userCategories: Pick<Category, 'name' | 'description'>[] = [
    { name: 'Work', description: 'Work related activities' },
    { name: 'Distraction', description: 'Non-productive activities' },
    { name: 'Meeting', description: 'Video calls and meetings' }
  ];
  
  const activityDetails: Pick<
    ActiveWindowDetails, 
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  > = {
    ownerName: 'Google Chrome',
    title: 'GitHub - Implementing LLM failover',
    url: 'https://github.com/noa-no-h/cronus-1/pull/42',
    content: 'Implementation of LLM failover mechanism to handle rate limits',
    type: 'browser',
    browser: 'chrome'
  };
  
  try {
    console.log('Testing category choice with failover...');
    const categoryResult = await getCategoryChoice(
      userProjectsAndGoals,
      userCategories,
      activityDetails
    );
    
    console.log('Category choice result:', categoryResult);
    
  console.log('Testing emoji generation with failover...');
  const emoji = await getEmoji('Coding', 'Programming and development work');
    
    console.log('Emoji result:', emoji);
    
    console.log('Tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testLLMFailover()
  .then(() => console.log('Test script completed'))
  .catch(err => console.error('Test script error:', err));