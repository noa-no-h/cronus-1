import { ActiveWindowDetails, Category } from '../../../../shared/types';
import * as LLMImpl from './llm-impl';
import * as OpenAILLM from './llm';
import * as HuggingFaceLLM from './llm-huggingface';

// LLM Provider configuration
type LLMProvider = 'openai' | 'huggingface';

// Configuration for LLM provider selection
let currentProvider: LLMProvider = 'openai'; // Default to OpenAI

/**
 * Set the LLM provider to use for categorization and other LLM functions
 * @param provider The LLM provider to use ('openai' or 'huggingface')
 */
export function setLLMProvider(provider: LLMProvider): void {
  currentProvider = provider;
  console.log(`[LLM] Provider set to: ${provider}`);
  // Update runtime implementation selection in llm-impl
  if (provider === 'huggingface') {
    LLMImpl.setImplementation('huggingface');
  } else {
    LLMImpl.setImplementation('openai');
  }
}

/**
 * Get the current LLM provider
 * @returns The current LLM provider
 */
export function getLLMProvider(): LLMProvider {
  return currentProvider;
}

/**
 * Get a category choice based on user activity details
 * Uses the currently selected LLM provider
 */
export async function getCategoryChoice(
  userProjectsAndGoals: string,
  userCategories: Pick<Category, 'name' | 'description'>[],
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
) {
  return LLMImpl.getCategoryChoice(userProjectsAndGoals, userCategories, activityDetails);
}

/**
 * Get a summary for an activity block
 * Uses the currently selected LLM provider
 */
export async function getSummaryForBlock(
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<string | null> {
  const result = await LLMImpl.getSummaryForBlock(activityDetails);
  return typeof result === 'string' || result === null ? result : null;
}

/**
 * Check if a window title is informative
 * Uses the currently selected LLM provider
 */
export async function checkTitleInformative(title: string): Promise<boolean> {
  const result = await LLMImpl.isTitleInformative(title);
  return typeof result === 'boolean' ? result : false;
}

/**
 * Generate a summary for user activity data
 * Uses the currently selected LLM provider
 */
export async function generateSummaryForActivity(activityData: any): Promise<string> {
  const result = await LLMImpl.generateSummaryForActivity(activityData);
  return typeof result === 'string' ? result : '';
}

/**
 * Get an emoji for a category
 * Uses the currently selected LLM provider
 */
export async function getEmoji(
  name: string,
  description?: string
): Promise<string | null> {
  const result = await LLMImpl.getEmoji(name, description);
  return typeof result === 'string' || result === null ? result : null;
}