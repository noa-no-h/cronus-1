import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { z } from 'zod';
import { ActiveWindowDetails, Category as CategoryType } from '../../../../shared/types';
import { tokenTracker } from '../tracking/tokenUsageTracker';
import { redactActivityDetails } from './redaction-helper';

// Debug logging when this module is loaded
console.log('[LLM-GEMINI] Module loaded');

// Confirm API key availability
if (!process.env.GEMINI_API_KEY) {
  console.warn('[LLM-GEMINI] Warning: GEMINI_API_KEY not set in environment');
}

// LLM Models configuration
interface ModelConfig {
  provider: 'gemini';
  modelName: string;
  client: OpenAI;
}

// Configure Gemini client using OpenAI compatibility layer
const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  defaultHeaders: {
    'User-Agent': 'Cronus Productivity Tracker',
  },
});

// Available models registry
const availableModels: ModelConfig[] = [
  {
    provider: 'gemini',
    modelName: 'gemini-2.0-flash',  // Fastest model
    client: geminiClient,
  },
  {
    provider: 'gemini',
    modelName: 'gemini-2.0-pro',  // More capable model
    client: geminiClient,
  },
  {
    provider: 'gemini',
    modelName: 'gemini-1.5-flash', // Fallback model
    client: geminiClient,
  },
];

// Default model to use first
let currentModelIndex = 0;

// Helper function to get the next model when failover is needed
function getNextModel(): ModelConfig {
  currentModelIndex = (currentModelIndex + 1) % availableModels.length;
  return availableModels[currentModelIndex];
}

// Get current model
function getCurrentModel(): ModelConfig {
  return availableModels[currentModelIndex];
}

// Helper function to clean LLM responses
export function cleanLLMResponse(content: string): string {
  // First check for full markdown code blocks
  const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)\s*```/;
  const match = content.match(codeBlockRegex);
  
  if (match && match[1]) {
    console.log("[LLM-Gemini] Cleaned markdown code block from response");
    return match[1].trim();
  }
  
  // If no code block found, check if the response starts with ```json and remove it
  if (content.trim().startsWith("```json")) {
    console.log("[LLM-Gemini] Removed starting markdown code block syntax from response");
    return content.trim().replace(/^```json\s*/, "").replace(/\s*```\s*$/, "");
  }
  
  // Check if content ends with ``` (closing markdown block)
  if (content.trim().endsWith("```")) {
    console.log("[LLM-Gemini] Removed ending markdown code block syntax from response");
    return content.trim().replace(/\s*```\s*$/, "");
  }
  
  return content.trim();
}

// Zod schema for LLM output: Expecting the name of one of the user's categories
const CategoryChoiceSchema = z.object({
  chosenCategoryName: z.string(),
  summary: z
    .string()
    .describe(
      'A short summary of what the user is seeing. DO NOT conjecture about what they might be doing. Max 10 words.'
    ),
  reasoning: z
    .string()
    .describe(
      'Short explanation of why this category was chosen based on the content and users work/goals. Keep it very short and concise. Max 20 words.'
    ),
});

/**
 * Get a category choice based on user activity details using Gemini API (via OpenAI compatibility)
 * 
 * @param userProjectsAndGoals The user's projects and goals
 * @param userCategories The user's categories
 * @param activityDetails Details about the current window activity
 * @returns The chosen category and reasoning
 */
/**
 * Get a category choice based on user activity details using Gemini API (via OpenAI compatibility)
 * 
 * @param userProjectsAndGoals The user's projects and goals
 * @param userCategories The user's categories
 * @param activityDetails Details about the current window activity
 * @returns The chosen category and reasoning
 */
export async function getCategoryChoice(
  userProjectsAndGoals: string,
  userCategories: Pick<CategoryType, 'name' | 'description'>[],
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<{
  chosenCategoryName: string;
  summary: string;
  reasoning: string;
}> {
  // Redact any sensitive information before sending to external API
  const redactedActivityDetails = redactActivityDetails(activityDetails, {
    redactionText: '[PRIVATE_INFO_REDACTED]',
    logCounts: true,
  });

  const { ownerName, title, url, content, type, browser } = redactedActivityDetails;

  // Create category list for prompt
  const categoryListText = userCategories
    .map((category) => `- ${category.name}: ${category.description || '(No description)'}`)
    .join('\n');

  // Build messages for the model
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are an AI assistant that categorizes a user's current computer activity based on the provided information.`
    },
    {
      role: 'user',
      content: `
The user has the following goals and projects:

${userProjectsAndGoals || '(No specific goals or projects defined)'}

The user has defined the following activity categories:

${categoryListText}

The user is currently using:
- Application: ${ownerName || 'Unknown'}
- Window title: ${title || 'Unknown'}
- URL: ${url ? (url.length > 150 ? url.substring(0, 150) + '...' : url) : 'None'}
- Content visible: ${content ? (content.length > 7000 ? content.substring(0, 7000) + '...' : content) : 'None'}
- Window type: ${type || 'Unknown'}
- Browser: ${browser || 'N/A'}

Based on this information, determine which ONE of the user's predefined categories this activity belongs to.
Respond with JSON in the following format:
{
  "chosenCategoryName": "THE_EXACT_NAME_OF_ONE_OF_THE_USER_CATEGORIES_LISTED_ABOVE",
  "summary": "A short summary of what the user is seeing. DO NOT conjecture about what they might be doing. Max 10 words.",
  "reasoning": "Short explanation of why this category was chosen based on the content and users work/goals. Keep it very short and concise. Max 20 words."
}

Choose the most appropriate category based on the content and the user's goals. If the activity appears to be a distraction or not related to the user's goals, categorize it accordingly.
      `
    }
  ];

  try {
    // Get current model configuration
    const modelConfig = getCurrentModel();
    
    console.log(`[LLM-Gemini] Using model: ${modelConfig.modelName}`);
    
    // Start token counting (for estimation)
    const startTime = performance.now();
    
    // Make the API call using OpenAI-compatible Gemini endpoint
    const response = await modelConfig.client.chat.completions.create({
      model: modelConfig.modelName,
      messages: messages,
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });
    
    // End token counting
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    console.log(`[LLM-Gemini] Response received in ${Math.round(responseTime)}ms`);
    
    // Get response content
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from Gemini API');
    }
    
    // Clean response text of any markdown code blocks
    const cleanedResponse = cleanLLMResponse(content);
    
    // Estimate token usage based on characters (since we don't get exact token counts)
    const promptChars = JSON.stringify(messages).length;
    const completionChars = cleanedResponse.length;
    const promptTokens = Math.ceil(promptChars / 4); // Rough estimation
    const completionTokens = Math.ceil(completionChars / 4); // Rough estimation
    
    // Track token usage
    tokenTracker.trackUsage({
      model: modelConfig.modelName,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
      totalTokens: promptTokens + completionTokens,
      endpoint: 'categorization',
      success: true
    });
    
    try {
      // Parse the JSON response
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate against schema
      const validated = CategoryChoiceSchema.parse(parsed);
      
      // Find the chosen category
      const chosenCategory = userCategories.find(
        (c) => c.name.toLowerCase() === validated.chosenCategoryName.toLowerCase()
      );

      if (!chosenCategory) {
        console.warn(
          `[LLM-Gemini] Chosen category "${validated.chosenCategoryName}" not found in user categories. Using first available category.`
        );
        
        // Fall back to the first category if the chosen one doesn't exist
        return {
          chosenCategoryName: userCategories[0]?.name || "Unknown",
          summary: validated.summary || "",
          reasoning: `Fallback: ${validated.reasoning || "No match found"}`,
        };
      }

      console.log(`[CategorizationService] LLM chose category: "${chosenCategory.name}". Reasoning: "${validated.reasoning}", Summary: "${validated.summary}"`);
      
      return {
        chosenCategoryName: chosenCategory.name,
        summary: validated.summary || "",
        reasoning: validated.reasoning || "",
      };
    } catch (parseError) {
      console.error('[LLM-Gemini] Failed to parse response:', parseError);
      console.error('Raw response:', content);
      
      // Fall back to first category on error
      return {
        chosenCategoryName: userCategories[0]?.name || "Unknown",
        summary: "Error parsing LLM response",
        reasoning: "Fallback due to error in parsing LLM response",
      };
    }
  } catch (error) {
    console.error('[LLM-Gemini] API call failed:', error);
    
    // Try with next model if available
    const nextModel = getNextModel();
    console.log(`[LLM-Gemini] Trying next model: ${nextModel.modelName}`);
    
    // If we've cycled through all models, fall back to first category
    if (nextModel === availableModels[0]) {
      return {
        chosenCategoryName: userCategories[0]?.name || "Unknown",
        summary: "Error communicating with LLM API",
        reasoning: "Fallback due to API communication error",
      };
    }
    
    // Try again with next model
    return getCategoryChoice(userProjectsAndGoals, userCategories, activityDetails);
  }
}

/**
 * Generate a summary for a text block
 * 
 * @param text The text to summarize
 * @returns A summary of the text
 */
export async function getGeminiSummaryForBlock(text: string): Promise<string> {
  // Redact any sensitive information before sending to external API
  const redactedText = redactActivityDetails({ content: text }, {
    redactionText: '[PRIVATE_INFO_REDACTED]',
    logCounts: true,
  }).content || '';

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant that summarizes text concisely.'
    },
    {
      role: 'user',
      content: `
Summarize the following text in 1-2 sentences, focusing on the key points:

${redactedText}

Your summary should be clear, concise, and capture the main idea of the text.
`
    }
  ];

  try {
    const modelConfig = getCurrentModel();
    
    // Start token counting
    const startTime = performance.now();
    
    const response = await modelConfig.client.chat.completions.create({
      model: modelConfig.modelName,
      messages: messages,
      temperature: 0.2,
      max_tokens: 100,
    });
    
    // End token counting
    const endTime = performance.now();
    
    const content = response.choices[0]?.message?.content || 'No summary available';
    
    // Estimate token usage based on characters
    const promptChars = JSON.stringify(messages).length;
    const completionChars = content.length;
    const promptTokens = Math.ceil(promptChars / 4);
    const completionTokens = Math.ceil(completionChars / 4);
    
    // Track token usage
    tokenTracker.trackUsage({
      model: modelConfig.modelName,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
      totalTokens: promptTokens + completionTokens,
      endpoint: 'summarization',
      success: true
    });
    
    return content.trim();
  } catch (error) {
    console.error('[LLM-Gemini] Failed to generate summary:', error);
    
    // Try next model
    const nextModel = getNextModel();
    console.log(`[LLM-Gemini] Trying next model for summary: ${nextModel.modelName}`);
    
    // If we've tried all models, return simple fallback
    if (nextModel === availableModels[0]) {
      return "Summary unavailable due to API error";
    }
    
    // Try again with next model
    return getGeminiSummaryForBlock(text);
  }
}

/**
 * Check if a window title is informative enough
 * 
 * @param title The window title to check
 * @returns Whether the title is informative
 */
export async function isGeminiTitleInformative(title: string): Promise<boolean> {
  // Redact any sensitive information
  const redactedTitle = redactActivityDetails({ title }, {
    redactionText: '[PRIVATE_INFO_REDACTED]',
  }).title || '';

  // Don't bother with API calls for very short titles
  if (!redactedTitle || redactedTitle.length < 3) {
    return false;
  }
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You evaluate whether window titles are informative or generic.'
    },
    {
      role: 'user',
      content: `
Determine if the following window title is informative or generic:

"${redactedTitle}"

A title is informative if it provides specific context about the content or purpose of the window.
Examples of informative titles:
- "How to Build a React App - Step by Step Tutorial"
- "Quarterly Sales Report - Q1 2023"
- "Jane Smith - Professional Resume"

Examples of generic titles:
- "Untitled"
- "New Document"
- "Home"
- "Dashboard"

Respond with only "true" if the title is informative, or "false" if it is generic.
`
    }
  ];

  try {
    const modelConfig = getCurrentModel();
    
    const response = await modelConfig.client.chat.completions.create({
      model: modelConfig.modelName,
      messages: messages,
      temperature: 0.1,
      max_tokens: 10,
    });
    
    const content = response.choices[0]?.message?.content?.trim().toLowerCase() || 'false';
    
    // Estimate token usage
    const promptChars = JSON.stringify(messages).length;
    const completionChars = content.length;
    const promptTokens = Math.ceil(promptChars / 4);
    const completionTokens = Math.ceil(completionChars / 4);
    
    // Track token usage
    tokenTracker.trackUsage({
      model: modelConfig.modelName,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
      totalTokens: promptTokens + completionTokens,
      endpoint: 'title_check',
      success: true
    });
    
    return content === "true";
  } catch (error) {
    console.error('[LLM-Gemini] Failed to check title informativeness:', error);
    // Default to assuming title is informative on error
    return true;
  }
}

/**
 * Generate a summary for an activity
 * 
 * @param activityDetails Details about the activity
 * @returns A summary of the activity
 */
export async function generateGeminiActivitySummary(
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<string> {
  // Redact any sensitive information in the activity data 
  const redactedActivityDetails = redactActivityDetails(activityDetails, {
    redactionText: '[PRIVATE_INFO_REDACTED]',
    logCounts: true,
  });
  
  // Create a concise description from the available fields
  const appInfo = redactedActivityDetails.ownerName || "Unknown application";
  const titleInfo = redactedActivityDetails.title || "";
  const urlInfo = redactedActivityDetails.url ? 
    (redactedActivityDetails.url.length > 100 ? redactedActivityDetails.url.substring(0, 100) + "..." : redactedActivityDetails.url) : "";
  
  // Take a small excerpt of the content if available
  const contentExcerpt = redactedActivityDetails.content ? 
    (redactedActivityDetails.content.length > 300 ? redactedActivityDetails.content.substring(0, 300) + "..." : redactedActivityDetails.content) : "";
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You create brief, factual summaries of user activities.'
    },
    {
      role: 'user',
      content: `
Create a brief, factual summary (max 10 words) of what the user is viewing based on:

APP: ${redactedActivityDetails.ownerName}
TITLE: ${redactedActivityDetails.title || ''}
URL: ${urlInfo}
CONTENT: ${contentExcerpt}
TYPE: ${redactedActivityDetails.type}
BROWSER: ${redactedActivityDetails.browser || ''}

Focus only on what's actually visible. Do not speculate about user actions or intentions. 
Be concise and factual. Maximum 10 words.
`
    }
  ];

  try {
    const modelConfig = getCurrentModel();
    
    const response = await modelConfig.client.chat.completions.create({
      model: modelConfig.modelName,
      messages: messages,
      temperature: 0.2,
      max_tokens: 50,
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Estimate token usage
    const promptChars = JSON.stringify(messages).length;
    const completionChars = content.length;
    const promptTokens = Math.ceil(promptChars / 4);
    const completionTokens = Math.ceil(completionChars / 4);
    
    // Track token usage
    tokenTracker.trackUsage({
      model: modelConfig.modelName,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
      totalTokens: promptTokens + completionTokens,
      endpoint: 'activity_summary',
      success: true
    });
    
    let summary = content.trim();
    
    // Ensure the summary is not too long
    if (summary.length > 100) {
      summary = summary.substring(0, 97) + "...";
    }
    
    return summary;
  } catch (error) {
    console.error('[LLM-Gemini] Failed to generate activity summary:', error);
    
    // Try next model
    const nextModel = getNextModel();
    console.log(`[LLM-Gemini] Trying next model for activity summary: ${nextModel.modelName}`);
    
    // If we've tried all models, return simple fallback
    if (nextModel === availableModels[0]) {
      // Create a basic summary from the available fields
      if (titleInfo) {
        return `Viewing: ${titleInfo.substring(0, 50)}`;
      } else if (urlInfo) {
        return `Browsing: ${urlInfo.substring(0, 50)}`;
      } else {
        return `Using ${appInfo}`;
      }
    }
    
    // Try again with next model
    return generateGeminiActivitySummary(activityDetails);
  }
}

/**
 * Get an emoji for a category
 * 
 * @param categoryName The name of the category
 * @param categoryDescription The description of the category
 * @returns An emoji representing the category
 */
export async function getEmojiForCategory(
  categoryName: string,
  categoryDescription?: string
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You choose appropriate emojis for category names.'
    },
    {
      role: 'user',
      content: `
Choose a single emoji that best represents this category:
Category name: "${categoryName}"
${categoryDescription ? `Category description: "${categoryDescription}"` : ''}

Respond with exactly one emoji character and nothing else. Choose an emoji that visually represents the category's purpose.
`
    }
  ];

  try {
    const modelConfig = getCurrentModel();
    
    const response = await modelConfig.client.chat.completions.create({
      model: modelConfig.modelName,
      messages: messages,
      temperature: 0.2,
      max_tokens: 10,
    });
    
    const content = response.choices[0]?.message?.content?.trim() || '📋';
    
    // Extract just the first emoji
    const emojiRegex = /(\p{Emoji})/u;
    const match = content.match(emojiRegex);
    
    if (match && match[1]) {
      return match[1];
    } else {
      console.warn('[LLM-Gemini] No emoji found in response:', content);
      return '📋'; // Default emoji
    }
  } catch (error) {
    console.error('[LLM-Gemini] Failed to get emoji:', error);
    return '📋'; // Default emoji on error
  }
}

// Export functions with standardized names
export {
  // getCategoryChoice is already exported directly above
  getGeminiSummaryForBlock as getSummaryForBlock,
  generateGeminiActivitySummary as generateActivitySummary,
  isGeminiTitleInformative as isTitleInformative,
  getEmojiForCategory as getEmoji,
};
