import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { z } from 'zod';
import { ActiveWindowDetails, Category as CategoryType } from '../../../../shared/types';

const openai = new OpenAI(); // Ensure OPENAI_API_KEY is set

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

const SuggestedCategorySchema = z.object({
  name: z.string(),
  description: z.string(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  isProductive: z.boolean(),
  emoji: z.string().describe('A single emoji to represent the category.'),
});

const SuggestedCategoriesSchema = z.object({
  categories: z.array(SuggestedCategorySchema),
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
- Activity: Look at New Tab in browser, and other necessary browser operations (like settings, etc). Categories: "Work", "Distraction". Correct Category: "Work"

TASK:
Look at the CURRENT ACTIVITY through the lens of the user's PROJECTS AND GOALS.
Which of the USER'S CATEGORIES best supports their stated objectives?
If the activity is unrelated to the user's stated projects and goals (if they properly set their projects/goals), it should be categorized as "Distraction" regardless of the activity type.
If the activity doesn't neatly fit into any of the other categories it's likely a distraction.
Respond with the category name and your reasoning.
          `,
    },
  ];
}

// TODO: could add Retry Logic with Consistency Check
export async function getOpenAICategorySuggestion(
  userProjectsAndGoals: string
): Promise<z.infer<typeof SuggestedCategoriesSchema> | null> {
  const promptInput = _buildOpenAICategorySuggestionPromptInput(userProjectsAndGoals);
  try {
    const response = await openai.responses.parse({
      model: 'gpt-4o-2024-08-06',
      temperature: 0,
      input: promptInput,
      text: {
        format: zodTextFormat(SuggestedCategoriesSchema, 'suggested_categories'),
      },
    });

    if (!response.output_parsed || 'refusal' in response.output_parsed) {
      console.warn('OpenAI response issue or refusal selecting category:', response.output_parsed);
      return null;
    }

    const distractionCategory = {
      name: 'Distraction',
      description: 'Scrolling social media, browsing unrelated content, or idle clicking',
      color: '#EC4899',
      emoji: '🎮',
      isProductive: false,
    };

    // Filter out any "Distraction" category that might have been generated by the LLM
    const filteredCategories = response.output_parsed.categories.filter(
      (category) => category.name.toLowerCase() !== 'distraction'
    );

    // Add our standardized "Distraction" category
    const finalCategories = {
      categories: [...filteredCategories, distractionCategory],
    };

    return finalCategories;
  } catch (error) {
    console.error('Error getting OpenAI category choice:', error);
    return null;
  }
}

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

  try {
    const response = await openai.responses.parse({
      // changing this to gpt-4o-mini will cause the "car Instagram profile" test to fail lol
      model: 'gpt-4o-2024-08-06',
      temperature: 0, // Deterministic output
      input: promptInput,
      text: {
        format: zodTextFormat(CategoryChoiceSchema, 'category_choice'),
      },
    });

    if (!response.output_parsed || 'refusal' in response.output_parsed) {
      console.warn('OpenAI response issue or refusal selecting category:', response.output_parsed);
      return null;
    }

    return response.output_parsed;
  } catch (error) {
    console.error('Error getting OpenAI category choice:', error);
    return null;
  }
}

function _buildOpenAICategorySuggestionPromptInput(userProjectsAndGoals: string) {
  return [
    {
      role: 'system' as const,
      content: `You are an AI assistant that helps users create personalized productivity categories based on their goals.

You will be given a user's goals and a list of template categories.
Your task is to generate a list of 3-5 relevant categories tailored to the user's specific goals. For each category, you must suggest a name, description, color, a boolean for isProductive, and a single emoji.

IMPORTANT: Prefer using the provided template categories when they broadly cover an activity. Only create a new category if no template is a good fit.

For example:
- If a user's goal is to "build the windows version of the app", the existing "Coding" category is a better choice than creating a new, highly specific "Windows Development" category.
- No need to only use the default categories. For ex. if someone says they have drawing as a hobby, they might need a "Drawing" category (in that case we dont use the "Design" category).
- If a user is a "CPA", they might need new categories like "Bookkeeping", "Tax", and "Consulting", since these are not in the template list.
- Don't litterally use XYZ but fill in the name of the specific company, project, client, etc.

Here are some good default categories that work for many people:
- name: Contracting for XYZ, description: Working on a project for Contractor work for XYZ including meetings, emails, etc. related to that project
- name: Coding, description: Writing or reviewing code, debugging, working in IDEs or terminals, emoji: 💼, isProductive: true
- name: Design, description: Working in design tools like Figma or Illustrator on UX/UI or visual assets, emoji: 🎨
- name: Product Management, description: Planning features, writing specs, managing tickets, reviewing user feedback, emoji: 📈, isProductive: true
- name: Fundraising, description: Pitching to investors, refining decks, writing emails or grant applications, emoji: 💰, isProductive: true
- name: Growth & Marketing, description: Working on campaigns, analytics, user acquisition, SEO or outreach, emoji: 🚀, isProductive: true
- name: Work Communication, description: Responding to emails, Slack, Notion, meetings or async updates, emoji: 💬, isProductive: true
- name: Dating, description: Using dating apps, messaging, browsing profiles, or going on dates, emoji: ❤️, isProductive: false
- name: Eating & Shopping, description: Eating meals, cooking, groceries, or online/in-person shopping, emoji: 🍔, isProductive: false
- name: Sport & Health, description: Exercising, walking, gym, sports, wellness, etc., emoji: 💪, isProductive: true
- name: Friends & Social, description: Spending time with friends or socializing in person or online, emoji: 🎉, isProductive: false
- name: Planning & Reflection, description: Journaling, reflecting on goals, or reviewing personal plans, emoji: 📝, isProductive: true
- name: Commuting, description: Traveling to or from work, errands, or social events, emoji: 🚗, isProductive: false

For the color, use Notion-style color like #3B82F6, #A855F7, #F97316, #CA8A04, #10B981, #06B6D4, #6B7280, #8B5CF6, #D946EF, #F59E0B, #22C55E, etc. (Don't use #EC4899)

Respond with a list of suggested categories in the format requested.`,
    },
    {
      role: 'user' as const,
      content: `
USER'S PROJECTS AND GOALS:
${userProjectsAndGoals}

TASK:
Generate a list of 3-5 personalized categories based on the user's goals.
`,
    },
  ];
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
      model: 'gpt-4o-2024-08-06',
      messages: prompt as ChatCompletionMessageParam[],
      max_tokens: 50,
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error getting OpenAI summary for block:', error);
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
      model: 'gpt-4o-2024-08-06',
      messages: prompt as ChatCompletionMessageParam[],
      max_tokens: 3,
      temperature: 0,
    });
    const answer = response.choices[0]?.message?.content?.trim().toLowerCase();
    const result = answer?.startsWith('yes') ?? false;
    return result;
  } catch (error) {
    console.error('Error getting OpenAI title informative:', error);
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
      model: 'gpt-4o-2024-08-06',
      messages: prompt as ChatCompletionMessageParam[],
      max_tokens: 50,
      temperature: 0.3,
    });
    const generatedTitle = response.choices[0]?.message?.content?.trim() || '';
    return generatedTitle;
  } catch (error) {
    console.error('Error getting OpenAI activity summary:', error);
    return '';
  }
}

/**
 * Suggest a single emoji for a category using OpenAI.
 * @param name The category name
 * @param description The category description (optional)
 * @returns The suggested emoji as a string, or null if failed
 */
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
      model: 'gpt-4o-2024-08-06',
      messages: prompt,
      max_tokens: 4,
      temperature: 0,
    });
    const emoji = response.choices[0]?.message?.content?.trim() || null;
    // Basic validation: must be a single unicode emoji character (or short sequence)
    if (emoji && emoji.length <= 4) {
      return emoji;
    }
    return null;
  } catch (error) {
    console.error('Error getting emoji for category:', error);
    return null;
  }
}
