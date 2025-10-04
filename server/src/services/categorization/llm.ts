import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { z } from 'zod';
import { ActiveWindowDetails, Category as CategoryType } from '../../../../shared/types';


// Update OpenAI client to use Cerebras
const openai = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY || '', // Use Cerebras API key
  baseURL: 'https://api.cerebras.ai/v1',
  defaultHeaders: {
    'User-Agent': 'Cronus Productivity Tracker', // Required by Cerebras
  },
});


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

function _buildOpenAICategoryChoicePromptInput(
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

Respond with the category name and your reasoning.
          `,
    },
  ];
}

// TODO: could add Retry Logic with Consistency Check
export async function getOpenAICategoryChoice(
  userProjectsAndGoals: string,
  userCategories: Pick<CategoryType, 'name' | 'description'>[], // Pass only name and description for the prompt
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<z.infer<typeof CategoryChoiceSchema> | null> {
  // Returns the chosen category NAME or null if error/no choice
  const promptInput = _buildOpenAICategoryChoicePromptInput(
    userProjectsAndGoals,
    userCategories,
    activityDetails
  );

  // Add this to your prompt builder:
  promptInput[promptInput.length - 1].content += `
Respond ONLY in this JSON format:
{
  "chosenCategoryName": "<category name>",
  "summary": "<short summary>",
  "reasoning": "<short reasoning>"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b', // Cerebras model name
      messages: promptInput,
      temperature: 0,
      max_tokens: 200,
    });
    const content = response.choices[0]?.message?.content || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse LLM output as JSON:', content);
      return null;
    }
    if (
      typeof parsed === 'object' &&
      typeof parsed.chosenCategoryName === 'string' &&
      typeof parsed.summary === 'string' &&
      typeof parsed.reasoning === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch (error: unknown) {
    // Type-safe error handling
    console.error('Cerebras API error:', 
      typeof error === 'object' && error !== null ? 
        JSON.stringify({
          status: (error as any).status,
          message: (error as any).message,
          name: (error as any).name
        }) : 
        error
    );
    
    // Safe way to access nested response data
    if (
      typeof error === 'object' && 
      error !== null && 
      'response' in error && 
      (error as any).response && 
      'data' in (error as any).response
    ) {
      console.error('Response:', (error as any).response.data);
    } else {
      console.error('No detailed response data available');
    }
    
    return null;
  }
}

// fallback for title

export async function getOpenAISummaryForBlock(
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

  try {
    const response = await openai.chat.completions.create({
      model: 'llama3.1-8b', // Cerebras model name
      messages: prompt as ChatCompletionMessageParam[],
      max_tokens: 50,
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error getting Cerebras summary for block:', error);
    return null;
  }
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

  try {
    const response = await openai.chat.completions.create({
      model: 'llama3.1-8b', // Cerebras model name
      messages: prompt as ChatCompletionMessageParam[],
      max_tokens: 3,
      temperature: 0,
    });
    const answer = response.choices[0]?.message?.content?.trim().toLowerCase();
    const result = answer?.startsWith('yes') ?? false;
    return result;
  } catch (error) {
    return false;
  }
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

  try {
    const response = await openai.chat.completions.create({
      model: 'llama3.1-8b', // Cerebras model name
      messages: prompt as ChatCompletionMessageParam[],
      max_tokens: 50,
      temperature: 0.3,
    });
    const generatedTitle = response.choices[0]?.message?.content?.trim() || '';
    return generatedTitle;
  } catch (error) {
    return '';
  }
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
  try {
    const response = await openai.chat.completions.create({
      model: 'llama3.1-8b', // Cerebras model name
      messages: prompt,
      max_tokens: 10,
      temperature: 0,
    });
    const emoji = response.choices[0]?.message?.content?.trim() || null;
    // More robust validation: check if it's a single emoji character or sequence
    // This regex broadly matches various unicode emoji patterns.
    const emojiRegex =
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    if (emoji && emojiRegex.test(emoji) && emoji.length <= 10) {
      // Keep a length check, but regex is primary
      return emoji;
    }
    return null;
  } catch (error) {
    console.error('Error getting emoji for category:', error);
    return null;
  }
}
