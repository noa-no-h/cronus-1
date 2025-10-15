import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { z } from 'zod';
import { ActiveWindowDetails, Category as CategoryType } from '../../../../shared/types';
import { tokenTracker } from '../tracking/tokenUsageTracker';

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2'; // Change to your preferred model

// Reset token counters for Ollama models when module loads
tokenTracker.resetProviderUsage('ollama');

// Helper function to call Ollama API
async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false, // Set to true if you want streaming
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { response: string };
  return data.response || '';
}

// Helper function to estimate token counts (rough approximation)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// Track token usage for monitoring
function trackTokenUsage(promptText: string, responseText: string, endpoint: string) {
  const promptTokens = estimateTokenCount(promptText);
  const completionTokens = estimateTokenCount(responseText);
  const totalTokens = promptTokens + completionTokens;

  tokenTracker.trackUsage({
    model: OLLAMA_MODEL,
    promptTokens,
    completionTokens,
    totalTokens,
    endpoint,
    success: true,
  });

  console.error(`[TokenUsage] ${OLLAMA_MODEL} ${endpoint}: ${promptTokens} prompt + ${completionTokens} completion = ${totalTokens} total tokens`);
}

// NEW Zod schema for LLM output: Expecting the name of one of the user's categories
const CategoryChoiceSchema = z.object({
  chosenCategoryName: z.string(),
  reasoning: z.string(),
  summary: z.string(),
});

/**
 * Get category choice for user activity
 */
export async function getCategoryChoice(
  userProjectsAndGoals: string,
  userCategories: Pick<CategoryType, 'name' | 'description'>[],
  activeWindow: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<{ chosenCategoryName: string; summary: string; reasoning: string }> {
  const categoryNames = userCategories.map((c) => c.name);

  const promptText = `
You are an AI assistant helping categorize user activity.

USER GOALS AND PROJECTS
${userProjectsAndGoals}

USER CATEGORIES
${userCategories.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

WINDOW DETAILS
- Title: ${activeWindow.title || 'N/A'}
- URL: ${activeWindow.url || 'N/A'}
- Process: ${activeWindow.ownerName}
- Content: ${activeWindow.content ? activeWindow.content.substring(0, 500) : 'N/A'}

Based solely on this information, select the most appropriate category for this activity.
Consider how the activity relates to the user's stated goals and projects.
Your output must be valid JSON with the format:
{
  "chosenCategoryName": "Category Name",
  "reasoning": "Brief explanation of why this category was selected",
  "summary": "Brief summary of what the user is doing (max 2 sentences)"
}

Choose only from these categories: ${categoryNames.join(', ')}
`;

  try {
    const responseText = await callOllama(promptText);
    trackTokenUsage(promptText, responseText, "categorization");

    // Try to parse the JSON response
    const cleanedResponse = cleanLLMResponse(responseText);
    const parsed = JSON.parse(cleanedResponse);

    // Validate with Zod
    const validated = CategoryChoiceSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('[LLM-Ollama] Error in getCategoryChoice:', error);
    // Fallback: return a default category
    return {
      chosenCategoryName: userCategories[0]?.name || 'Uncategorized',
      reasoning: 'Error occurred during categorization',
      summary: 'Unable to categorize activity'
    };
  }
}

/**
 * Get a summary for an activity block
 */
export async function getSummaryForBlock(
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<string | null> {
  const promptText = `
Summarize the following user activity in 1-2 sentences:

APP: ${activityDetails.ownerName}
TITLE: ${activityDetails.title || ''}
URL: ${activityDetails.url || ''}
CONTENT: ${activityDetails.content ? activityDetails.content.slice(0, 1000) : ''}
TYPE: ${activityDetails.type}
BROWSER: ${activityDetails.browser || ''}

Summary:
`;

  try {
    const responseText = await callOllama(promptText);
    trackTokenUsage(promptText, responseText, "summary");
    return responseText.trim();
  } catch (error) {
    console.error('[LLM-Ollama] Error in getSummaryForBlock:', error);
    return null;
  }
}

/**
 * Check if a window title is informative
 */
export async function isTitleInformative(title: string): Promise<boolean> {
  const promptText = `
Is the following window title informative enough to understand what the user is doing? Answer with only "yes" or "no":

Title: "${title}"
`;

  try {
    const responseText = await callOllama(promptText);
    trackTokenUsage(promptText, responseText, "title-check");
    const answer = responseText.trim().toLowerCase();
    return answer.includes('yes');
  } catch (error) {
    console.error('[LLM-Ollama] Error in isTitleInformative:', error);
    return false;
  }
}

/**
 * Generate a summary for user activity data
 */
export async function generateSummaryForActivity(activityData: any): Promise<string> {
  const promptText = `
Generate a brief summary of the following user activity data:

${JSON.stringify(activityData, null, 2)}

Summary:
`;

  try {
    const responseText = await callOllama(promptText);
    trackTokenUsage(promptText, responseText, "activity-summary");
    return responseText.trim();
  } catch (error) {
    console.error('[LLM-Ollama] Error in generateSummaryForActivity:', error);
    return 'Unable to generate summary';
  }
}

/**
 * Get an emoji for a category
 */
export async function getEmoji(name: string, description?: string): Promise<string | null> {
  const promptText = `
Suggest a single emoji that represents the following category:

Category: ${name}
${description ? `Description: ${description}` : ''}

Respond with only the emoji, no other text.
`;

  try {
    const responseText = await callOllama(promptText);
    trackTokenUsage(promptText, responseText, "emoji");
    // Extract just the emoji (assuming it's the first character or a simple emoji)
    const emoji = responseText.trim().match(/[\p{Emoji}]/u)?.[0];
    return emoji || null;
  } catch (error) {
    console.error('[LLM-Ollama] Error in getEmoji:', error);
    return null;
  }
}

// Helper function to clean LLM responses
export function cleanLLMResponse(content: string): string {
  // First check for full markdown code blocks
  const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)\s*```/;
  const match = codeBlockRegex.exec(content);

  if (match && match[1]) {
    console.log("[LLM] Cleaned markdown code block from response");
    return match[1].trim();
  }

  // If no code block found, check if the response starts with ```json and remove it
  if (content.trim().startsWith("```json")) {
    console.log("[LLM] Removed starting markdown code block syntax from response");
    return content.trim().replace(/^```json\s*/, "").replace(/\s*```\s*$/, "");
  }

  // Check if content ends with ``` (closing markdown block)
  if (content.trim().endsWith("```")) {
    console.log("[LLM] Removed ending markdown code block syntax from response");
    return content.trim().replace(/\s*```\s*$/, "");
  }

  return content.trim();
}
