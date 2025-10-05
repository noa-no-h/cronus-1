import { tokenTracker } from './services/tracking/tokenUsageTracker';

// Simulate some token usage
function simulateTokenUsage() {
  // Simulate usage for GPT-4
  tokenTracker.trackUsage({
    model: 'gpt-4',
    promptTokens: 150,
    completionTokens: 50,
    totalTokens: 200,
    endpoint: 'completion',
    success: true
  });
  
  // Simulate usage for GPT-3.5
  tokenTracker.trackUsage({
    model: 'gpt-3.5-turbo',
    promptTokens: 100,
    completionTokens: 30,
    totalTokens: 130,
    endpoint: 'chat',
    success: true
  });
  
  // Simulate a failed API call
  tokenTracker.trackUsage({
    model: 'gpt-4',
    promptTokens: 200,
    completionTokens: 0,
    totalTokens: 200,
    endpoint: 'completion',
    success: false
  });
}

// Run simulation
console.log('Simulating token usage...');
simulateTokenUsage();

// Force flush and get stats
tokenTracker.flush();
const stats = tokenTracker.getTokenUsageStats();

console.log('\nCurrent token usage stats:');
console.log(JSON.stringify(stats, null, 2));

console.log('\nToken usage file path:', tokenTracker['statsFile']);