import { tokenTracker } from './services/tracking/tokenUsageTracker';

// Configure token limits
tokenTracker.setDailyLimit(1000000); // 1M tokens per day
tokenTracker.setAvgTokensPerCall(1400); // Average 1400 tokens per call

// Simulate some token usage
function simulateTokenUsage() {
  // Simulate usage for llama-3.3-70b
  tokenTracker.trackUsage({
    model: 'llama-3.3-70b',
    promptTokens: 1308,
    completionTokens: 112,
    totalTokens: 1420,
    endpoint: 'categorization',
    success: true
  });
  
  // Simulate usage for GPT-3.5
  tokenTracker.trackUsage({
    model: 'gpt-3.5-turbo',
    promptTokens: 500,
    completionTokens: 150,
    totalTokens: 650,
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

// Log detailed usage status
console.log('\n');
tokenTracker.logUsageStatus();

// Show file location
console.log('\nToken usage data stored at:', tokenTracker['statsFile']);

// Show calculation of max calls per day
const dailyLimit = 1000000;
const avgTokensPerCall = 1400;
const maxCallsPerDay = Math.floor(dailyLimit / avgTokensPerCall);
const callsPerHour24 = Math.floor(maxCallsPerDay / 24);
const callsPerHour8 = Math.floor(maxCallsPerDay / 8);

console.log('\nMax calls per day calculation:');
console.log(`Daily token limit: ${dailyLimit.toLocaleString()} tokens`);
console.log(`Average tokens per call: ${avgTokensPerCall} tokens`);
console.log(`Maximum calls per day: ${maxCallsPerDay} calls`);
console.log(`Calls per hour (24h): ${callsPerHour24} calls/hour`);
console.log(`Calls per hour (8h workday): ${callsPerHour8} calls/hour`);