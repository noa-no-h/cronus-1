// Unified implementation wrapper for LLM functions.
// Edit only `forceImplementation` or set `LLM_IMPLEMENTATION` in the environment to switch.

const forceImplementation: 'openai' | 'huggingface' | 'gemini' | null = 'gemini'; // set null to 'openai' to force
// Add debug logging to see which implementation is chosen
const impl = (forceImplementation || (process.env.LLM_IMPLEMENTATION as any) || 'openai') as 'openai' | 'huggingface' | 'gemini';
console.log(`[LLM-IMPL] Using implementation: ${impl} (forceImplementation=${forceImplementation}, env=${process.env.LLM_IMPLEMENTATION})`);

// Load the appropriate backend module
let backend: any;
function loadBackend() {
  try {
    if (impl === 'huggingface') {
      console.log('[LLM-IMPL] Loading Hugging Face implementation');
      backend = require('./llm-huggingface');
    } else if (impl === 'gemini') {
      console.log('[LLM-IMPL] Loading Gemini implementation');
      try {
        // Try native implementation first
        backend = require('./llm-gemini-native');
        console.log('[LLM-IMPL] Successfully loaded native Gemini implementation');
      } catch (nativeError) {
        console.error('[LLM-IMPL] Error loading native Gemini implementation:', nativeError);
        console.log('[LLM-IMPL] Falling back to OpenAI compatibility implementation');
        try {
          backend = require('./llm-gemini-actual');
          console.log('[LLM-IMPL] Successfully loaded Gemini OpenAI compatibility implementation');
        } catch (compatError) {
          console.error('[LLM-IMPL] Error loading Gemini OpenAI compatibility implementation:', compatError);
          throw new Error('Failed to load any Gemini implementation');
        }
      }
    } else {
      console.log('[LLM-IMPL] Loading OpenAI implementation');
      backend = require('./llm');
    }
    console.log(`[LLM-IMPL] Successfully loaded ${impl} implementation`);
    return backend;
  } catch (error) {
    console.error(`[LLM-IMPL] Error loading ${impl} implementation:`, error);
    // Fall back to OpenAI if there's an error
    console.log('[LLM-IMPL] Falling back to OpenAI implementation due to error');
    return require('./llm');
  }
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
    try {
      backend = require('./llm-gemini-native');
    } catch (e) {
      backend = require('./llm-gemini-actual');
    }
  } else {
    backend = require('./llm');
  }
  
  // Because we're using function-based exports, they'll automatically pick up
  // the new backend next time they're called
  console.log(`[LLM-IMPL] Switched implementation to: ${provider}`);
}
