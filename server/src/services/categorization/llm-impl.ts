// Unified implementation wrapper for LLM functions.
// Edit only `forceImplementation` or set `LLM_IMPLEMENTATION` in the environment to switch.

const forceImplementation: 'openai' | 'huggingface' | 'gemini' | null = 'gemini'; // set null to 'openai' to force
const impl = (forceImplementation || (process.env.LLM_IMPLEMENTATION as any) || 'openai') as 'openai' | 'huggingface' | 'gemini';

// Load the appropriate backend module
let backend: any;
function loadBackend() {
  if (impl === 'huggingface') {
    backend = require('./llm-huggingface');
  } else if (impl === 'gemini') {
    backend = require('./llm-gemini');
  } else {
    backend = require('./llm');
  }
  return backend;
}

// Initialize backend
backend = loadBackend();

// Function-based exports to ensure we always get the correct function from the backend
export function getCategoryChoice(...args: any[]) {
  const fn = backend.getCategoryChoice || backend.getHuggingFaceCategoryChoice || backend.getOpenAICategoryChoice;
  if (!fn) throw new Error('No category choice function available in the LLM implementation');
  return fn(...args);
}

export function getSummaryForBlock(...args: any[]) {
  const fn = backend.getSummaryForBlock || backend.getHuggingFaceSummaryForBlock || backend.getOpenAISummaryForBlock;
  if (!fn) throw new Error('No summary function available in the LLM implementation');
  return fn(...args);
}

export function isTitleInformative(...args: any[]) {
  const fn = backend.isTitleInformative || (backend as any).isTitleInformative;
  if (!fn) throw new Error('No title informativeness function available in the LLM implementation');
  return fn(...args);
}

export function generateSummaryForActivity(...args: any[]) {
  const fn = backend.generateActivitySummary || backend.generateSummaryForActivity;
  if (!fn) throw new Error('No activity summary function available in the LLM implementation');
  return fn(...args);
}

export function getEmoji(...args: any[]) {
  const fn = backend.getEmoji || backend.getEmojiForCategory;
  if (!fn) throw new Error('No emoji function available in the LLM implementation');
  return fn(...args);
}

// Allow runtime switching if needed
export function setImplementation(provider: 'openai' | 'huggingface' | 'gemini') {
  if (provider === 'huggingface') {
    backend = require('./llm-huggingface');
  } else if (provider === 'gemini') {
    backend = require('./llm-gemini');
  } else {
    backend = require('./llm');
  }
  
  // Because we're using function-based exports, they'll automatically pick up
  // the new backend next time they're called
  console.log(`[LLM-IMPL] Switched implementation to: ${provider}`);
}
