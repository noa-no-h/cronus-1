// Unified implementation wrapper for LLM functions.
// Edit only `forceImplementation` or set `LLM_IMPLEMENTATION` in the environment to switch.

// Import the token tracker to reset daily usage when loaded
import { tokenTracker } from '../tracking/tokenUsageTracker';

// --- DEBUG TOGGLE ---
// Set this to true to enable debug logs, false to only log errors
export const DEBUG = false;

function logDebug(...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[LLM-IMPL]', ...args);
  }
}

function logError(...args: unknown[]) {
  // Always log errors
  // eslint-disable-next-line no-console
  console.error('[LLM-IMPL]', ...args);
}

// Reset daily usage when the implementation is loaded (start fresh each time)
tokenTracker.resetDailyUsage();

const forceImplementation: 'openai' | 'huggingface' | 'gemini' | 'ollama' | null = 'ollama'; // set null to 'openai' to force
// Add debug logging to see which implementation is chosen
const impl = (forceImplementation || (process.env.LLM_IMPLEMENTATION as any) || 'openai') as 'openai' | 'huggingface' | 'gemini' | 'ollama';
logDebug(`Using implementation: ${impl} (forceImplementation=${forceImplementation}, env=${process.env.LLM_IMPLEMENTATION})`);

// Load the appropriate backend module
let backend: any;
function loadBackend() {
  try {
    if (impl === 'huggingface') {
  logDebug('Loading Hugging Face implementation');
      backend = require('./llm-huggingface');
    } else if (impl === 'gemini') {
  logDebug('Loading Gemini implementation');
      try {
        // Try native implementation first
        backend = require('./llm-gemini-native');
  logDebug('Successfully loaded native Gemini implementation');
      } catch (nativeError) {
  logError('Error loading native Gemini implementation:', nativeError);
  logDebug('Falling back to OpenAI compatibility implementation');
        try {
          backend = require('./llm-gemini-actual');
          logDebug('Successfully loaded Gemini OpenAI compatibility implementation');
        } catch (compatError) {
          logError('Error loading Gemini OpenAI compatibility implementation:', compatError);
          throw new Error('Failed to load any Gemini implementation');
        }
      }
    } else if (impl === 'ollama') {
  console.log('[LLM-IMPL] Loading Ollama implementation');
      backend = require('./llm-ollama');
    } else {
  logDebug('Loading OpenAI implementation');
      backend = require('./llm');
    }
  logDebug(`Successfully loaded ${impl} implementation`);
    return backend;
  } catch (error) {
  logError(`Error loading ${impl} implementation:`, error);
  // Fall back to OpenAI if there's an error
  logError('Falling back to OpenAI implementation due to error');
    return require('./llm');
  }
}

// Initialize backend
backend = loadBackend();


// --- LLM CACHE ---
const LLM_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const llmCache = new Map();

function getCacheKey(fnName: string, args: unknown[]): string {
  // Use function name and JSON-stringified arguments as the cache key
  return fnName + ':' + JSON.stringify(args);
}

async function getOrCache<T>(fnName: string, fn: (...args: unknown[]) => Promise<T> | T, args: unknown[]): Promise<T> {
  const key = getCacheKey(fnName, args);
  const cached = llmCache.get(key);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < LLM_CACHE_TTL) {
    return cached.value;
  }
  const result = await fn(...args);
  llmCache.set(key, { value: result, timestamp: now });
  return result;
}

// Function-based exports to ensure we always get the correct function from the backend, with caching
export function getCategoryChoice(...args: unknown[]): Promise<unknown> {
  const fn = backend.getCategoryChoice || backend.getHuggingFaceCategoryChoice || backend.getOpenAICategoryChoice;
  if (!fn) throw new Error('No category choice function available in the LLM implementation');
  return getOrCache('getCategoryChoice', fn, args);
}

export function getSummaryForBlock(...args: unknown[]): Promise<unknown> {
  const fn = backend.getSummaryForBlock || backend.getHuggingFaceSummaryForBlock || backend.getOpenAISummaryForBlock;
  if (!fn) throw new Error('No summary function available in the LLM implementation');
  return getOrCache('getSummaryForBlock', fn, args);
}

export function isTitleInformative(...args: unknown[]): Promise<unknown> {
  const fn = backend.isTitleInformative || (backend as any).isTitleInformative;
  if (!fn) throw new Error('No title informativeness function available in the LLM implementation');
  return getOrCache('isTitleInformative', fn, args);
}

export function generateSummaryForActivity(...args: unknown[]): Promise<unknown> {
  const fn = backend.generateActivitySummary || backend.generateSummaryForActivity;
  if (!fn) throw new Error('No activity summary function available in the LLM implementation');
  return getOrCache('generateSummaryForActivity', fn, args);
}

export function getEmoji(...args: unknown[]): Promise<unknown> {
  const fn = backend.getEmoji || backend.getEmojiForCategory;
  if (!fn) throw new Error('No emoji function available in the LLM implementation');
  return getOrCache('getEmoji', fn, args);
}

// Allow runtime switching if needed
export function setImplementation(provider: 'openai' | 'huggingface' | 'gemini') {
  // Reset usage counters when switching implementation
  tokenTracker.resetDailyUsage();
  
  if (provider === 'huggingface') {
    backend = require('./llm-huggingface');
  } else if (provider === 'gemini') {
    backend = require('./llm-gemini-actual');
  } else {
    backend = require('./llm');
  }
  
  // Because we're using function-based exports, they'll automatically pick up
  // the new backend next time they're called
  logDebug(`Switched implementation to: ${provider}`);
}
