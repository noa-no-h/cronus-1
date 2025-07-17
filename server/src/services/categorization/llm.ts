import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
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

TASK:
Look at the CURRENT ACTIVITY through the lens of the user's PROJECTS AND GOALS.
Which of the USER'S CATEGORIES best supports their stated objectives?
If the activity is unrelated to the user's stated projects and goals, it should be categorized as "Distraction" regardless of the activity type.
If the activity doesn't neatly fit into any of the other categories it's likely a distraction.
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
      messages: prompt,
      max_tokens: 50,
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error getting OpenAI summary for block:', error);
    return null;
  }
}
