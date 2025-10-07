/**
 * Gemini Implementation for LLM Services
 * 
 * This module uses Google's Generative AI APIs via OpenAI's compatibility layer
 * to categorize user activities, generate summaries, and provide other LLM services.
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { OpenAI } from 'openai';
import { backOff } from "exponential-backoff";

import { tokenTracker } from '../tracking/tokenUsageTracker';
import { redactSensitiveInfo } from './redaction-helper';

// Initialize environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug initialization
console.log('[LLM-Gemini-Actual] Initializing module with Gemini 1.5 models');

// Reset token counters for this provider when module loads
tokenTracker.resetProviderUsage('gemini');
tokenTracker.resetProviderUsage('models/gemini');

// Initialize client with OpenAI-compatible Gemini endpoint
const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  baseURL: "https://generativelanguage.googleapis.com/v1beta/models",
});

// Model configuration - using a single model for simplicity
// This will ensure more consistent behavior with the API
const availableModels = [
  'gemini-pro', // Default Gemini Pro model
];

// Debug flag (set to true to see more detailed logs)
const DEBUG = true;

// Helper function to retry API calls with exponential backoff
async function retryAPICall<T>(fn: () => Promise<T>, model: string): Promise<T> {
  try {
    return await backOff(() => fn(), {
      jitter: 'full',
      numOfAttempts: 3,
      startingDelay: 1000,
      timeMultiple: 2,
      retry: (e: any, attemptNumber: number) => {
        console.error(`[LLM-Gemini] Error with model ${model} (attempt ${attemptNumber}):`, e.message || e);
        return true;
      },
    });
  } catch (error: any) {
    throw new Error(`All retry attempts failed for model ${model}: ${error.message || error}`);
  }
}

// Helper function to make API calls and handle fallback between models
async function withFallback<T>(
  apiCallFn: (model: string) => Promise<T>,
  defaultValue: T,
  context: string
): Promise<T> {
  for (const model of availableModels) {
    try {
      console.log(`[LLM-Gemini] Trying model: ${model}`);
      const result = await retryAPICall(() => apiCallFn(model), model);
      return result;
    } catch (error: any) {
      console.error(`[LLM-Gemini] Failed with model ${model} for ${context}:`, error.message || error);
      if (availableModels.indexOf(model) < availableModels.length - 1) {
        console.log(`[LLM-Gemini] Trying next model: ${availableModels[availableModels.indexOf(model) + 1]}`);
      } else {
        console.log(`[LLM-Gemini] All models failed, using default value`);
      }
    }
  }
  
  console.error(`[LLM-Gemini] All models failed for ${context}, using default value`);
  return defaultValue;
}

// Helper to estimate token counts (since Gemini doesn't return token usage)
function estimateTokenCount(text: string): number {
  // Simple approximation: average of 4 characters per token
  return Math.ceil(text.length / 4);
}

// Track token usage for monitoring
function trackTokenUsage(model: string, promptText: string, responseText: string, endpoint: string) {
  const promptTokens = estimateTokenCount(promptText);
  const completionTokens = estimateTokenCount(responseText);
  const totalTokens = promptTokens + completionTokens;
  
  tokenTracker.trackUsage({
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    endpoint,
    success: true,
  });
  
  if (DEBUG) {
    console.log(`[TokenUsage] ${model} ${endpoint}: ${promptTokens} prompt + ${completionTokens} completion = ${totalTokens} total tokens`);
  }
  
  return { promptTokens, completionTokens, totalTokens };
}

/**
 * Get category choice for user activity
 */
export async function getCategoryChoice(
  userProjectsAndGoals: string,
  userCategories: { name: string; description: string }[],
  activeWindow: { title: string; url: string | null; content: string; processName: string; firstSeen: number }
): Promise<{ chosenCategoryName: string; summary: string; reasoning: string }> {
  // Redact sensitive information
  const redactedTitle = redactSensitiveInfo(activeWindow.title).text;
  const redactedUrl = activeWindow.url ? redactSensitiveInfo(activeWindow.url).text : null;
  const redactedContent = redactSensitiveInfo(activeWindow.content).text;
  
  const categoryNames = userCategories.map((c) => c.name);
  
  const promptText = `
You are an AI assistant helping categorize user activity.

USER GOALS AND PROJECTS
${userProjectsAndGoals}

USER CATEGORIES
${userCategories.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

WINDOW DETAILS
- Title: ${redactedTitle}
- URL: ${redactedUrl || 'N/A'}
- Process: ${activeWindow.processName}
- Content: ${redactedContent.substring(0, 500)}

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

  return await withFallback(
    async (model: string) => {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a helpful assistant that categorizes user activity." },
            { role: "user", content: promptText }
          ],
          temperature: 0.2,
          max_tokens: 300,
        });

        const responseText = completion.choices[0].message.content || '';
        trackTokenUsage(model, promptText, responseText, "categorization");
        
        // Try to parse the JSON response
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON object found in response");
          }
          
          const parsedResponse = JSON.parse(jsonMatch[0]);
          
          // Validate and return the response
          if (!parsedResponse.chosenCategoryName) {
            throw new Error("Missing chosenCategoryName in response");
          }
          
          return {
            chosenCategoryName: parsedResponse.chosenCategoryName,
            summary: parsedResponse.summary || "Activity summary not provided",
            reasoning: parsedResponse.reasoning || "No reasoning provided",
          };
        } catch (parseError) {
          console.error("[LLM-Gemini] Failed to parse response:", parseError);
          throw new Error("Failed to parse LLM response");
        }
      } catch (error: any) {
        console.error(`[LLM-Gemini] API error with ${model}:`, error.message || error);
        throw error;
      }
    },
    {
      chosenCategoryName: "Distraction",
      summary: "Error communicating with LLM API",
      reasoning: "Fallback due to API communication error",
    },
    "categorization"
  );
}

/**
 * Get summary for a block of activity
 */
export async function getSummaryForBlock(
  content: string
): Promise<string> {
  // Redact sensitive information
  const redactedContent = redactSensitiveInfo(content).text;
  
  const promptText = `
Summarize the following activity in a very brief phrase (maximum 10 words):

${redactedContent.substring(0, 1000)}

Provide only the summary text with no additional commentary.
`;

  return await withFallback(
    async (model: string) => {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a helpful assistant that provides concise summaries." },
            { role: "user", content: promptText }
          ],
          temperature: 0.3,
          max_tokens: 30,
        });

        const responseText = completion.choices[0].message.content || '';
        trackTokenUsage(model, promptText, responseText, "summary");
        
        // Clean up the response
        const cleanedSummary = responseText
          .replace(/^["'\s]+|["'\s]+$/g, '') // Remove quotes and whitespace
          .replace(/^Summary: /i, '') // Remove "Summary:" prefix if present
          .trim();
          
        return cleanedSummary;
      } catch (error: any) {
        console.error(`[LLM-Gemini] API error with ${model}:`, error.message || error);
        throw error;
      }
    },
    "Activity summary unavailable",
    "summary"
  );
}

/**
 * Check if a title is informative
 */
export async function isTitleInformative(
  title: string
): Promise<boolean> {
  // Redact sensitive information
  const redactedTitle = redactSensitiveInfo(title).text;
  
  const promptText = `
Is the following window title informative about what the user is doing? 
Title: "${redactedTitle}"

Answer with only YES or NO.
`;

  return await withFallback(
    async (model: string) => {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a helpful assistant that evaluates window titles." },
            { role: "user", content: promptText }
          ],
          temperature: 0.1,
          max_tokens: 10,
        });

        const responseText = completion.choices[0].message.content || '';
        trackTokenUsage(model, promptText, responseText, "title_check");
        
        return responseText.toLowerCase().includes('yes');
      } catch (error: any) {
        console.error(`[LLM-Gemini] API error with ${model}:`, error.message || error);
        throw error;
      }
    },
    false,
    "title_check"
  );
}

/**
 * Generate a summary for activity
 */
export async function generateActivitySummary(
  activeWindow: { title: string; url: string | null; content: string; processName: string },
  contextLines: string[],
  userGoals?: string
): Promise<string> {
  // Redact sensitive information
  const redactedTitle = redactSensitiveInfo(activeWindow.title).text;
  const redactedUrl = activeWindow.url ? redactSensitiveInfo(activeWindow.url).text : null;
  const redactedContent = redactSensitiveInfo(activeWindow.content).text;
  
  // Redact each context line
  const redactedContext = contextLines.map(line => redactSensitiveInfo(line).text);
  
  const promptText = `
Summarize what the user is doing based on the following information:

WINDOW DETAILS
- Title: ${redactedTitle}
- URL: ${redactedUrl || 'N/A'}
- Process: ${activeWindow.processName}
- Content: ${redactedContent.substring(0, 300)}

RECENT ACTIVITY
${redactedContext.join('\n')}

${userGoals ? `USER GOALS\n${userGoals}\n` : ''}

Provide a very brief summary (maximum 15 words) of what the user is doing.
Focus on the specific task or content, not just the application.
`;

  return await withFallback(
    async (model: string) => {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a helpful assistant that provides concise summaries." },
            { role: "user", content: promptText }
          ],
          temperature: 0.3,
          max_tokens: 50,
        });

        const responseText = completion.choices[0].message.content || '';
        trackTokenUsage(model, promptText, responseText, "activity_summary");
        
        // Clean up the response
        const cleanedSummary = responseText
          .replace(/^["'\s]+|["'\s]+$/g, '') // Remove quotes and whitespace
          .replace(/^Summary: /i, '') // Remove "Summary:" prefix if present
          .trim();
          
        return cleanedSummary;
      } catch (error: any) {
        console.error(`[LLM-Gemini] API error with ${model}:`, error.message || error);
        throw error;
      }
    },
    "Using " + activeWindow.processName,
    "activity_summary"
  );
}

/**
 * Get emoji for a category
 */
export async function getEmojiForCategory(
  categoryName: string,
  categoryDescription: string
): Promise<string> {
  const promptText = `
Select a single emoji that best represents this category:
- Category Name: ${categoryName}
- Description: ${categoryDescription}

Reply with only one emoji and nothing else.
`;

  return await withFallback(
    async (model: string) => {
      try {
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: "You are a helpful assistant that selects appropriate emojis." },
            { role: "user", content: promptText }
          ],
          temperature: 0.3,
          max_tokens: 10,
        });

        const responseText = completion.choices[0].message.content || '';
        trackTokenUsage(model, promptText, responseText, "emoji");
        
        // Extract the first emoji from the response
        const emojiMatch = responseText.match(/\p{Emoji}/u);
        if (emojiMatch) {
          return emojiMatch[0];
        } else {
          throw new Error("No emoji found in response");
        }
      } catch (error: any) {
        console.error(`[LLM-Gemini] API error with ${model}:`, error.message || error);
        throw error;
      }
    },
    "📝", // Default emoji if all models fail
    "emoji"
  );
}

// Export the necessary functions with the expected aliases
export {
  getCategoryChoice as getOpenAICategoryChoice,
  getSummaryForBlock as getOpenAISummaryForBlock,
  getEmojiForCategory as getEmoji,
};

// Signal that the module is loaded
console.log("[LLM-Gemini] Loaded implementation with Gemini models via OpenAI compatibility layer");