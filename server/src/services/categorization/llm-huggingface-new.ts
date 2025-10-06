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

// Configure Hugging Face client using the OpenAI SDK
const huggingFaceClient = new OpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: process.env.HUGGINGFACE_API_KEY || '',
  defaultHeaders: {
    'User-Agent': 'Cronus Productivity Tracker',
  },
});

// Available models registry
const availableModels: ModelConfig[] = [
  {
    provider: 'huggingface',
    modelName: 'deepseek-ai/DeepSeek-V3-0324',
  },
  {
    provider: 'huggingface',
    modelName: 'meta-llama/Meta-Llama-3-8B-Instruct',
  },
  {
    provider: 'huggingface',
    modelName: 'mistralai/Mistral-7B-Instruct-v0.2',
  },
  {
    provider: 'huggingface',
    modelName: 'google/gemma-7b-it',
  },
  // You can specify a specific provider with modelName: "model:provider"
  // Example: "deepseek-ai/DeepSeek-V3-0324:nebius"
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

// Retry mechanism with model failover
export async function getHuggingFaceCategoryChoice(
  userProjectsAndGoals: string,
  userCategories: Pick<CategoryType, 'name' | 'description'>[], // Pass only name and description for the prompt
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<z.infer<typeof CategoryChoiceSchema> | null> {
  // Returns the chosen category NAME or null if error/no choice
  const promptInput = _buildHuggingFaceCategoryChoicePromptInput(
    userProjectsAndGoals,
    userCategories,
    activityDetails
  );

  // Add this to your prompt builder with explicit instructions to avoid markdown formatting:
  promptInput[promptInput.length - 1].content += `
IMPORTANT: Return ONLY the raw JSON without any markdown code block formatting or additional text.
`;

  // Get the initial model
  let currentModelConfig = getCurrentModel();
  const MAX_RETRIES = availableModels.length; // Try each model once
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[LLM-HF] Attempting categorization with model: ${currentModelConfig.modelName}`);
      
      const response = await huggingFaceClient.chat.completions.create({
        model: currentModelConfig.modelName,
        messages: promptInput,
        temperature: 0,
        max_tokens: 200,
      });
      
      // Track token usage
      if (response.usage) {
        tokenTracker.trackUsage({
          model: currentModelConfig.modelName,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          endpoint: 'categorization',
          success: true
        });
        
        // Log token usage
        console.log(
          `[TokenUsage] ${currentModelConfig.modelName} categorization: ` +
          `${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion = ` +
          `${response.usage.total_tokens} total tokens`
        );
      }
      
      let content = response.choices[0]?.message?.content || '';
      let parsed: any = null;
      
      // Clean up content if it's wrapped in markdown code blocks
      content = cleanLLMResponse(content);

      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.error(`[LLM-HF] Failed to parse output from ${currentModelConfig.modelName} as JSON:`, content);
        
        // Try to salvage the response by looking for a JSON structure anywhere in the content
        try {
          const jsonPattern = /{[\s\S]*?"chosenCategoryName"[\s\S]*?}/g;
          const possibleJson = content.match(jsonPattern);
          if (possibleJson && possibleJson[0]) {
            console.log(`[LLM-HF] Attempting to parse extracted JSON pattern: ${possibleJson[0]}`);
            parsed = JSON.parse(possibleJson[0]);
          }
        } catch (innerError) {
          console.error(`[LLM-HF] Failed second attempt to parse JSON from content`);
        }
        
        // If we still don't have valid parsed data, try next model
        if (!parsed) {
          currentModelConfig = getNextModel();
          retryCount++;
          continue;
        }
      }
      
      if (
        typeof parsed === 'object' &&
        typeof parsed.chosenCategoryName === 'string' &&
        typeof parsed.summary === 'string' &&
        typeof parsed.reasoning === 'string'
      ) {
        return parsed;
      }
      
      // If response format is invalid, try next model
      console.error(`[LLM-HF] Invalid response format from ${currentModelConfig.modelName}`);
      currentModelConfig = getNextModel();
      retryCount++;
      
    } catch (error: unknown) {
      // Check if it's a rate limit error (429)
      const status = typeof error === 'object' && error !== null ? (error as any).status : null;
      
      if (status === 429) {
        console.warn(`[LLM-HF] Rate limit (429) hit for ${currentModelConfig.modelName}, switching models...`);
        
        // Track rate limit as a failed request
        tokenTracker.trackUsage({
          model: currentModelConfig.modelName,
          promptTokens: 0,  // We don't know exactly how many tokens were in the failed request
          completionTokens: 0,
          totalTokens: 0,
          endpoint: 'categorization',
          success: false
        });
        
        currentModelConfig = getNextModel();
        retryCount++;
        continue;
      }
      
      // For other errors, log them but still try next model
      console.error(`[LLM-HF] Error with ${currentModelConfig.modelName}:`, 
        typeof error === 'object' && error !== null ? 
          JSON.stringify({
            status: (error as any).status,
            message: (error as any).message,
            name: (error as any).name
          }) : 
          error
      );
      
      // Track other errors
      tokenTracker.trackUsage({
        model: currentModelConfig.modelName,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        endpoint: 'categorization',
        success: false
      });
      
      // Safe way to access nested response data
      if (
        typeof error === 'object' && 
        error !== null && 
        'response' in error && 
        (error as any).response && 
        'data' in (error as any).response
      ) {
        console.error('Response:', (error as any).response.data);
      }
      
      // Try next model
      currentModelConfig = getNextModel();
      retryCount++;
    }
  }
  
  // If we've tried all models and none worked
  console.error(`[LLM-HF] All ${MAX_RETRIES} LLM models failed for categorization`);
  return null;
}

export async function getHuggingFaceSummaryForBlock(
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<string | null> {
  // You can use a similar prompt structure as getOpenAICategoryChoice, but focused on summarization
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

  // Get the initial model
  let currentModelConfig = getCurrentModel();
  const MAX_RETRIES = availableModels.length;
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[LLM-HF] Attempting summary with model: ${currentModelConfig.modelName}`);
      
      const response = await huggingFaceClient.chat.completions.create({
        model: currentModelConfig.modelName,
        messages: prompt as ChatCompletionMessageParam[],
        max_tokens: 50,
        temperature: 0.3,
      });
      
      // Track token usage
      if (response.usage) {
        tokenTracker.trackUsage({
          model: currentModelConfig.modelName,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          endpoint: 'summary',
          success: true
        });
        
        console.log(
          `[TokenUsage] ${currentModelConfig.modelName} summary: ` +
          `${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion = ` +
          `${response.usage.total_tokens} total tokens`
        );
      }
      
      const content = response.choices[0]?.message?.content;
      return content ? cleanLLMResponse(content) : null;
      
    } catch (error: unknown) {
      // Check if it's a rate limit error (429)
      const status = typeof error === 'object' && error !== null ? (error as any).status : null;
      
      if (status === 429) {
        console.warn(`[LLM-HF] Rate limit (429) hit for ${currentModelConfig.modelName}, switching models...`);
        
        // Track rate limit as a failed request
        tokenTracker.trackUsage({
          model: currentModelConfig.modelName,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          endpoint: 'summary',
          success: false
        });
        
        currentModelConfig = getNextModel();
        retryCount++;
        // Only continue if we have models left to try
        if (retryCount < MAX_RETRIES) {
          continue;
        }
      }
      
      console.error(`[LLM-HF] Error with ${currentModelConfig.modelName} for summary:`, 
        typeof error === 'object' && error !== null ? 
          JSON.stringify({
            status: (error as any).status,
            message: (error as any).message,
            name: (error as any).name
          }) : 
          error
      );
      
      // Track other errors
      tokenTracker.trackUsage({
        model: currentModelConfig.modelName,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        endpoint: 'summary',
        success: false
      });
      
      // Try next model
      currentModelConfig = getNextModel();
      retryCount++;
      
      // If we've tried all models, break the loop
      if (retryCount >= MAX_RETRIES) {
        break;
      }
    }
  }
  
  // If we've tried all models and none worked
  console.error(`[LLM-HF] All ${MAX_RETRIES} LLM models failed for summary`);
  return null;
}

export async function isTitleInformative(title: string): Promise<boolean> {
  const prompt = [
    {
      role: 'system' as const,
      content:
        'You are an AI assistant that evaluates if a window or activity title is informative and specific about what the user was doing. Answer only "yes" or "no". Only rendering the name of an application is not informative.',
    },
    {
      role: 'user' as const,
      content: `Title: "${title}"`,
    },
  ];

  // Get the initial model
  let currentModelConfig = getCurrentModel();
  const MAX_RETRIES = availableModels.length;
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[LLM-HF] Checking title with model: ${currentModelConfig.modelName}`);
      
      const response = await huggingFaceClient.chat.completions.create({
        model: currentModelConfig.modelName,
        messages: prompt as ChatCompletionMessageParam[],
        max_tokens: 3,
        temperature: 0,
      });
      
      // Track token usage
      if (response.usage) {
        tokenTracker.trackUsage({
          model: currentModelConfig.modelName,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          endpoint: 'titleCheck',
          success: true
        });
      }
      
      const content = response.choices[0]?.message?.content;
      const cleanedResponse = content ? cleanLLMResponse(content).toLowerCase() : '';
      const result = cleanedResponse.startsWith('yes');
      return result;
      
    } catch (error: unknown) {
      // Check if it's a rate limit error (429)
      const status = typeof error === 'object' && error !== null ? (error as any).status : null;
      
      if (status === 429) {
        console.warn(`[LLM-HF] Rate limit (429) hit for ${currentModelConfig.modelName}, switching models...`);
        currentModelConfig = getNextModel();
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          continue;
        }
      }
      
      console.error(`[LLM-HF] Error with ${currentModelConfig.modelName} for title check:`, error);
      
      // Try next model if available
      currentModelConfig = getNextModel();
      retryCount++;
      
      if (retryCount >= MAX_RETRIES) {
        break;
      }
    }
  }
  
  // Default to false if all models failed
  return false;
}

export async function generateActivitySummary(activityData: any): Promise<string> {
  const prompt = [
    {
      role: 'system' as const,
      content: `You are an AI assistant that summarizes user activity blocks for productivity tracking. 
      Provide a concise, short title (max 5-8 words) of what the user was doing, based on the app, window title, and context. You can include details about the content that you have about the activity. Be detailed, yet concise. The goal is to represent the activity in a way that is easy to understand and use for the user and make it easy for them to understand what they did during that activity block. It should not be just one or two words.`,
    },
    {
      role: 'user' as const,
      content: `ACTIVITY DATA: ${JSON.stringify(activityData)}`,
    },
  ];

  // Get the initial model
  let currentModelConfig = getCurrentModel();
  const MAX_RETRIES = availableModels.length;
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[LLM-HF] Generating summary with model: ${currentModelConfig.modelName}`);
      
      const response = await huggingFaceClient.chat.completions.create({
        model: currentModelConfig.modelName,
        messages: prompt as ChatCompletionMessageParam[],
        max_tokens: 50,
        temperature: 0.3,
      });
      
      // Track token usage
      if (response.usage) {
        tokenTracker.trackUsage({
          model: currentModelConfig.modelName,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          endpoint: 'activitySummary',
          success: true
        });
        
        console.log(
          `[TokenUsage] ${currentModelConfig.modelName} activity summary: ` +
          `${response.usage.total_tokens} total tokens`
        );
      }
      
      const content = response.choices[0]?.message?.content;
      return content ? cleanLLMResponse(content) : '';
      
    } catch (error: unknown) {
      // Check if it's a rate limit error (429)
      const status = typeof error === 'object' && error !== null ? (error as any).status : null;
      
      if (status === 429) {
        console.warn(`[LLM-HF] Rate limit (429) hit for ${currentModelConfig.modelName}, switching models...`);
        currentModelConfig = getNextModel();
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          continue;
        }
      }
      
      console.error(`[LLM-HF] Error with ${currentModelConfig.modelName} for activity summary:`, error);
      
      // Try next model if available
      currentModelConfig = getNextModel();
      retryCount++;
      
      if (retryCount >= MAX_RETRIES) {
        break;
      }
    }
  }
  
  // Return empty string if all models failed
  return '';
}

export async function getEmojiForCategory(
  name: string,
  description?: string
): Promise<string | null> {
  const prompt = [
    {
      role: 'system' as const,
      content: `You are an AI assistant that suggests a single emoji for a category. Respond with only the emoji, no text.`,
    },
    {
      role: 'user' as const,
      content: `Suggest a single emoji (just the emoji, no text) for a category with the following details.\nName: ${name}\nDescription: ${description || ''}`,
    },
  ];
  
  // Get the initial model
  let currentModelConfig = getCurrentModel();
  const MAX_RETRIES = availableModels.length;
  let retryCount = 0;
  
  // Emoji validation regex
  const emojiRegex =
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[LLM-HF] Getting emoji with model: ${currentModelConfig.modelName}`);
      
      const response = await huggingFaceClient.chat.completions.create({
        model: currentModelConfig.modelName,
        messages: prompt,
        max_tokens: 10,
        temperature: 0,
      });
      
      const content = response.choices[0]?.message?.content;
      const emoji = content ? cleanLLMResponse(content) : null;
      
      if (emoji && emojiRegex.test(emoji) && emoji.length <= 10) {
        return emoji;
      } else {
        console.warn(`[LLM-HF] Invalid emoji response from ${currentModelConfig.modelName}: "${emoji}"`);
        // Try next model if response isn't a valid emoji
        currentModelConfig = getNextModel();
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          continue;
        }
      }
      
    } catch (error: unknown) {
      // Check if it's a rate limit error (429)
      const status = typeof error === 'object' && error !== null ? (error as any).status : null;
      
      if (status === 429) {
        console.warn(`[LLM-HF] Rate limit (429) hit for ${currentModelConfig.modelName}, switching models...`);
        currentModelConfig = getNextModel();
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          continue;
        }
      }
      
      console.error(`[LLM-HF] Error with ${currentModelConfig.modelName} for emoji generation:`, error);
      
      // Try next model if available
      currentModelConfig = getNextModel();
      retryCount++;
      
      if (retryCount >= MAX_RETRIES) {
        break;
      }
    }
  }
  
  console.error(`[LLM-HF] All ${MAX_RETRIES} LLM models failed for emoji generation`);
  return null;
}