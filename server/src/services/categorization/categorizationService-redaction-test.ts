import { categorizeActivity } from './categorizationService';

async function test() {
  const userId = 'dummyUserId';
  const activeWindow = {
    ownerName: 'Chrome',
    type: 'browser' as const,
    browser: 'chrome' as const,
    title: 'My Bank - Card number entry',
    url: 'https://bank.com/credit-card',
    content: 'Please enter your Card number and SSN to continue.',
    durationMs: 1200000, // 20 minutes
    timestamp: Date.now()
  };

  // Mock DB/model functions if needed, or just observe the LLM input
  const result = await categorizeActivity(userId, activeWindow);
  console.log('Categorization result:', result);
}

test().catch(console.error);
