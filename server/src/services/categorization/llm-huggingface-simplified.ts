import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { z } from 'zod';
import { ActiveWindowDetails, Category as CategoryType } from '../../../../shared/types';
import { tokenTracker } from '../tracking/tokenUsageTracker';

// LLM Models configuration
interface ModelConfig {
  provider: string;
  modelName: string;
}

// SIMPLIFIED CLIENT CONFIGURATION - using the exact setup that worked in debug-router-api.ts
const huggingFaceClient = new OpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: process.env.HUGGINGFACE_API_KEY || '',
  // No additional headers needed
});

// Available models registry - just one model for now
const availableModels: ModelConfig[] = [
  {
    provider: 'huggingface',
    modelName: 'deepseek-ai/DeepSeek-V3-0324',
  }
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
    console.log("[LLM-HF] Cleaned markdown code block from response");
    return match[1].trim();
  }
  
  // If no code block found, check if the response starts with ```json and remove it
  if (content.trim().startsWith("```json")) {
    console.log("[LLM-HF] Removed starting markdown code block syntax from response");
    return content.trim().replace(/^```json\s*/, "").replace(/\s*```\s*$/, "");
  }
  
  // Check if content ends with ``` (closing markdown block)
  if (content.trim().endsWith("```")) {
    console.log("[LLM-HF] Removed ending markdown code block syntax from response");
    return content.trim().replace(/\s*```\s*$/, "");
  }
  
  return content.trim();
}

// NEW Zod schema for LLM output: Expecting the name of one of the user's categories
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

function _buildHuggingFaceCategoryChoicePromptInput(
  userProjectsAndGoals: string,
  userCategories: Pick<CategoryType, 'name' | 'description'>[],
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
) {
  const { ownerName, title, url, content, type, browser } = activityDetails;

  const categoryListForPrompt = userCategories
    .map((cat) => `- "${cat.name}"${cat.description ? ': ' + cat.description : ''}`)
    .join('\n  ');

  const MAX_URL_LENGTH = 150;
  const MAX_CONTENT_LENGTH = 7000;
  const truncatedUrl =
    url && url.length > MAX_URL_LENGTH ? `${url.slice(0, MAX_URL_LENGTH)}...` : url;
  const truncatedContent =
    content && content.length > MAX_CONTENT_LENGTH
      ? `${content.slice(0, MAX_CONTENT_LENGTH)}...`
      : content;

  const activityDetailsString = [
    ownerName && `Application: ${ownerName}`,
    title && `Window Title: ${title}`,
    truncatedUrl && `URL: ${truncatedUrl}`,
    truncatedContent && `Page Content: ${truncatedContent}`,
    type && `Type: ${type}`,
    browser && `Browser: ${browser}`,
  ]
    .filter(Boolean)
    .join('\n    ');

  return [
    {
      role: 'system' as const,
      content: `You are an AI assistant that categorizes activities based on CONTENT and PURPOSE, not just the platform or application being used.

IMPORTANT: Focus on what the user is actually doing and why, not just where they're doing it:
- YouTube can be work if it's educational content related to their goals
- Twitter/social media can be work if it's for professional networking or research
- The content and context matter more than the platform.

Based on the user's goals, their current activity, and their list of personal categories, choose the category name that best fits the activity.
${
  truncatedContent
    ? 'Note that the page content is fetched via the accessibility API and might include noise (e.g., sidebars).'
    : ''
}`,
    },
    {
      role: 'user' as const,
      content: `
USER'S PROJECTS AND GOALS:
${userProjectsAndGoals || 'Not set'}

USER'S CATEGORIES:
${categoryListForPrompt}

CURRENT ACTIVITY:
${activityDetailsString}

EXAMPLES OF CORRECT CATEGORIZATION:
- Activity: Watching a programming tutorial on YouTube. Goal: "Finish coding new feature". Categories: "Work", "Distraction". Correct Category: "Work".
- Activity: Browsing Instagram profile. Goal: "Find dream wife". Categories: "Find Dream Wife", "Social Media Distraction". Correct Category: "Find Dream Wife".
- Activity: Twitter DMs about user research. Goal: "Build novel productivity software". Categories: "Product Management", "Distraction". Correct Category: "Product Management".
- Activity: Watching random entertainment on YouTube. Goal: "Finish coding new feature". Categories: "Work", "Distraction". Correct Category: "Distraction".
- Activity: Drafting emails for unrelated side project. Goal: "Working on new social app". Categories: "Work Communication", "Distraction". Correct Category: "Distraction".
- Activity: Adjusting System Settings and view Cronus. Goal: "Finish my biophysics PHD etc". Categories: "Work", "Distraction". Correct Category: "Work".
- Activity: Staff Meeting. Goal: "CPA work". Categories: "Work", "Distraction". Correct Category: "Work".
- Activity: Meet - HOLD for Performance Management Training. Goals: N/Y. Categories: "Work", "Distraction". Correct Category: "Work".
- Activity: Looking at buying washing machine. Goal: "Study for Law degree, working in part-time job administering AirBnb appartments". Categories: "Studies", "AirBnb Management", "Distraction". Correct Category: "AirBnb Management".
- Activity: Looking at flight booking site. Goal: "Source manufacturers for my lamp product (Brighter), learn ML for job opportunities". Categories: "Other work", "Brighter", "Distraction". Reasoning: User is likely planning work related travel to source manufacturers. Correct Category: "Brighter".
- Activity: Look at New Tab in browser, and other necessary browser operations (like settings, etc). Categories: "Work", "Distraction". Correct Category: "Work"
 

TASK:
- Look at the CURRENT ACTIVITY through the lens of the user's PROJECTS AND GOALS.
- Which of the USER'S CATEGORIES best supports their stated objectives?
- **Crucially, first consider if the CURRENT ACTIVITY could be a step in achieving one of the USER'S PROJECTS AND GOALS, even if it seems unrelated at first.**
- Life admin activities like booking flights, are most likely work related or at least not a distraction.
- If the activity is obviously unrelated to the user's stated projects and goals (if they properly set their projects/goals), it should be categorized as "Distraction" regardless of the activity type.
- If the activity doesn't neatly fit into any of the other categories it's likely a distraction.

Respond ONLY in this JSON format WITHOUT any markdown code block formatting (no \`\`\` symbols):
{
  "chosenCategoryName": "<category name>",
  "summary": "<short summary>",
  "reasoning": "<short reasoning>"
}

IMPORTANT: Return ONLY the raw JSON without any markdown code block formatting or additional text.
          `,
    },
  ];
}

// SIMPLIFIED CATEGORY CHOICE FUNCTION
export async function getHuggingFaceCategoryChoice(
  userProjectsAndGoals: string,
  userCategories: Pick<CategoryType, 'name' | 'description'>[],
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<z.infer<typeof CategoryChoiceSchema> | null> {
  try {
    const promptInput = _buildHuggingFaceCategoryChoicePromptInput(
      userProjectsAndGoals,
      userCategories,
      activityDetails
    );
    
    // Use the same approach that worked in the debug script
    console.log('[LLM-HF] Attempting categorization with DeepSeek model');
    
    const response = await huggingFaceClient.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3-0324',
      messages: promptInput,
      temperature: 0,
      max_tokens: 200
    });
    
    // Track token usage
    if (response.usage) {
      tokenTracker.trackUsage({
        model: 'deepseek-ai/DeepSeek-V3-0324',
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        endpoint: 'categorization',
        success: true
      });
      
      console.log(
        `[TokenUsage] DeepSeek categorization: ` +
        `${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion = ` +
        `${response.usage.total_tokens} total tokens`
      );
    }
    
    let content = response.choices[0]?.message?.content || '';
    content = cleanLLMResponse(content);
    
    try {
      const parsed = JSON.parse(content);
      if (
        typeof parsed === 'object' &&
        typeof parsed.chosenCategoryName === 'string' &&
        typeof parsed.summary === 'string' &&
        typeof parsed.reasoning === 'string'
      ) {
        return parsed;
      }
    } catch (e) {
      console.error(`[LLM-HF] Failed to parse output as JSON:`, content);
    }
  } catch (error) {
    console.error('[LLM-HF] Error with categorization:', error);
  }
  
  return null;
}

// SIMPLIFIED SUMMARY FUNCTION
export async function getHuggingFaceSummaryForBlock(
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<string | null> {
  try {
    const prompt = [
      {
        role: 'system' as const,
        content: `You are an AI assistant that summarizes user activity blocks for productivity tracking. 
Provide a concise, one-line summary of what the user was likely doing in this time block, based on the app, window title, content, and any available context.`,
      },
      {
        role: 'user' as const,
        content: `
APP: ${activityDetails.ownerName}
TITLE: ${activityDetails.title || ''}
URL: ${activityDetails.url || ''}
CONTENT: ${activityDetails.content ? activityDetails.content.slice(0, 1000) : ''}
TYPE: ${activityDetails.type}
BROWSER: ${activityDetails.browser || ''}
`,
      },
    ];
    
    console.log('[LLM-HF] Attempting summary with DeepSeek model');
    
    const response = await huggingFaceClient.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3-0324',
      messages: prompt as ChatCompletionMessageParam[],
      max_tokens: 50,
      temperature: 0.3,
    });
    
    // Track token usage
    if (response.usage) {
      tokenTracker.trackUsage({
        model: 'deepseek-ai/DeepSeek-V3-0324',
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        endpoint: 'summary',
        success: true
      });
    }
    
    const content = response.choices[0]?.message?.content;
    return content ? cleanLLMResponse(content) : null;
  } catch (error) {
    console.error('[LLM-HF] Error with summary:', error);
    return null;
  }
}

// These are the other required functions with simplified implementations
export async function isTitleInformative(title: string): Promise<boolean> {
  // Simple implementation that always returns true for now
  return true;
}

export async function generateActivitySummary(activityData: any): Promise<string> {
  // Simple implementation that returns a fixed string for now
  return "Activity summary (placeholder)";
}

export async function getEmojiForCategory(name: string, description?: string): Promise<string | null> {
  // Simple implementation that returns a fixed emoji for now
  return "📝";
}