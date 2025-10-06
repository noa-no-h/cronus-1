// Unified implementation wrapper for LLM functions.
// Edit only `forceImplementation` or set `LLM_IMPLEMENTATION` in the environment to switch.

const forceImplementation: 'openai' | 'huggingface' | null = 'huggingface'; // set to 'huggingface' to force
const impl = (forceImplementation || (process.env.LLM_IMPLEMENTATION as any) || 'openai') as 'openai' | 'huggingface';

let backend: any;
if (impl === 'huggingface') {
  backend = require('./llm-huggingface');
} else {
  backend = require('./llm');
}

// Re-export a small, stable API that the rest of the code expects
export const getCategoryChoice = backend.getHuggingFaceCategoryChoice || backend.getOpenAICategoryChoice;
export const getSummaryForBlock = backend.getHuggingFaceSummaryForBlock || backend.getOpenAISummaryForBlock;
export const isTitleInformative = backend.isTitleInformative || (backend as any).isTitleInformative;
export const generateSummaryForActivity = backend.generateActivitySummary || backend.generateSummaryForActivity;
export const getEmoji = backend.getEmojiForCategory || backend.getEmoji;

// Allow runtime switching if needed
export function setImplementation(provider: 'openai' | 'huggingface') {
  if (provider === 'huggingface') {
    backend = require('./llm-huggingface');
  } else {
    backend = require('./llm');
  }
}
