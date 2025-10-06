/**
 * Debug script to check what's being exported from llm-impl.ts
 */

import * as llmImpl from '../llm-impl';

console.log('=== Checking llm-impl.ts exports ===');
console.log('getCategoryChoice:', typeof llmImpl.getCategoryChoice);
console.log('getSummaryForBlock:', typeof llmImpl.getSummaryForBlock);
console.log('isTitleInformative:', typeof llmImpl.isTitleInformative);
console.log('generateSummaryForActivity:', typeof llmImpl.generateSummaryForActivity);
console.log('getEmoji:', typeof llmImpl.getEmoji);

console.log('\n=== Checking backend object in llm-impl.ts ===');
// @ts-ignore - accessing internals for debugging
const backend = (llmImpl as any).backend;

if (backend) {
  console.log('Backend available functions:');
  Object.keys(backend).forEach(key => {
    console.log(`- ${key}: ${typeof backend[key]}`);
  });
} else {
  console.log('Backend object not accessible');
}