import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { ActiveWindowDetails, Category as CategoryType } from '../../../shared/types';
import { logToFile } from '../lib/logger';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { CategoryModel } from '../models/category';
import { User as UserModel } from '../models/user';

const openai = new OpenAI(); // Ensure OPENAI_API_KEY is set

// NEW Zod schema for LLM output: Expecting the name of one of the user's categories
const CategoryChoiceSchema = z.object({
  chosenCategoryName: z.string(),
  reasoning: z
    .string()
    .describe(
      'Brief explanation of why this category was chosen based on the content and user goals'
    ),
});

type UserGoals = {
  weeklyGoal: string;
  dailyGoal: string;
  lifeGoal: string;
};

interface CategorizationResult {
  categoryId: string | null;
}

function _buildOpenAICategoryChoicePromptInput(
  userGoals: UserGoals,
  userCategories: Pick<CategoryType, 'name' | 'description'>[],
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
) {
  const { ownerName, title, url, content, type, browser } = activityDetails;
  const { weeklyGoal, dailyGoal, lifeGoal } = userGoals;

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
GOAL ANALYSIS:
The user wants to achieve:
- Daily: "${dailyGoal || 'Not set'}"
- Weekly: "${weeklyGoal || 'Not set'}"
- Life: "${lifeGoal || 'Not set'}"

USER'S CATEGORIES:
${categoryListForPrompt}

CURRENT ACTIVITY:
${activityDetailsString}

EXAMPLES OF CORRECT CATEGORIZATION:
- Activity: Watching a programming tutorial on YouTube. Goal: "Finish coding new feature". Categories: "Work", "Distraction". Correct Category: "Work".
- Activity: Browsing Instagram profile. Goal: "Find dream wife". Categories: "Find Dream Wife", "Social Media Distraction". Correct Category: "Find Dream Wife".
- Activity: Twitter DMs about user research. Goal: "Build novel productivity software". Categories: "Product Management", "Distraction". Correct Category: "Product Management".
- Activity: Watching random entertainment on YouTube. Goal: "Finish coding new feature". Categories: "Work", "Distraction". Correct Category: "Distraction".

TASK:
Look at the CURRENT ACTIVITY through the lens of the user's GOALS.
Which of the USER'S CATEGORIES best supports their stated objectives?
Respond with the category name and your reasoning.
          `,
    },
  ];
}

// TODO: could add Retry Logic with Consistency Check
async function getOpenAICategoryChoice(
  userGoals: UserGoals,
  userCategories: Pick<CategoryType, 'name' | 'description'>[], // Pass only name and description for the prompt
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<z.infer<typeof CategoryChoiceSchema> | null> {
  // Returns the chosen category NAME or null if error/no choice
  const promptInput = _buildOpenAICategoryChoicePromptInput(
    userGoals,
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

async function checkActivityHistory(
  userId: string,
  activeWindow: Pick<ActiveWindowDetails, 'ownerName' | 'url' | 'type' | 'title'>
): Promise<string | null> {
  try {
    const queryCondition: any = { userId };
    const { ownerName, url, type, title } = activeWindow;

    if (url && type === 'browser') {
      // Most specific: Match by exact URL for browser activities
      queryCondition.url = url;
    } else if (type === 'browser' && title && title.trim() !== '' && (!url || url.trim() === '')) {
      // Next specific: Browser activity, no URL (or empty URL), but has a non-empty title
      // Match by ownerName AND title to distinguish between different tabs/windows of the same browser if URL is missing
      queryCondition.ownerName = ownerName;
      queryCondition.title = title;
    } else {
      // Fallback: Match by ownerName only (for non-browser apps, or browsers with no URL and no distinct title)
      queryCondition.ownerName = ownerName;
    }

    // Only proceed if a specific condition beyond just userId was added
    if (Object.keys(queryCondition).length === 1 && queryCondition.userId) {
      // console.log(
      //   '[CategorizationService] History check: Not enough specific identifiers (URL, Title for browser, or App Name) to perform history lookup. Skipping.'
      // );
      return null;
    }

    const lastEventWithSameIdentifier = await ActiveWindowEventModel.findOne(queryCondition)
      .sort({ timestamp: -1 })
      .select('categoryId')
      .lean();

    if (lastEventWithSameIdentifier && lastEventWithSameIdentifier.categoryId) {
      const categoryId = lastEventWithSameIdentifier.categoryId as string;
      const category = await CategoryModel.findById(categoryId).select('name').lean();
      const categoryName = category ? category.name : 'Unknown Category';
      // console.log(
      //   `[CategorizationService] History check found categoryId: ${categoryId}, Name: "${categoryName}" for ${activeWindow.ownerName || activeWindow.url}`
      // );
      return categoryId;
    }
  } catch (error) {
    console.error('[CategorizationService] Error during history check:', error);
    // Fall through to allow LLM categorization if history check fails
  }
  return null;
}

export async function categorizeActivity(
  userId: string,
  activeWindow: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<CategorizationResult> {
  await logToFile('categorizeActivity called', { userId, activeWindow });
  // 1. History Check
  const historicalCategoryId = await checkActivityHistory(userId, activeWindow);
  if (historicalCategoryId) {
    return { categoryId: historicalCategoryId };
  }

  // 2. LLM-based Categorization by choosing from user's list
  const user = await UserModel.findById(userId).select('userGoals').lean();
  const userGoals: UserGoals = user?.userGoals || { weeklyGoal: '', dailyGoal: '', lifeGoal: '' };

  const rawUserCategories = await CategoryModel.find({ userId }).lean();
  const userCategories: CategoryType[] = rawUserCategories.map((cat) => ({
    ...cat,
    _id: cat._id.toString(),
    userId: cat.userId.toString(),
  }));

  if (!userCategories || userCategories.length === 0) {
    console.warn(
      `[CategorizationService] User ${userId} has no categories defined. Cannot categorize.`
    );
    return { categoryId: null };
  }

  const categoryNamesForLLM = userCategories.map((c) => ({
    name: c.name,
    description: c.description,
  }));

  // TODO: grab the content (or first x chars of it) to increase precision
  // TODO-maybe: could add "unclear" here and then check the screenshot etc
  const choice = await getOpenAICategoryChoice(userGoals, categoryNamesForLLM, activeWindow);

  let determinedCategoryId: string | null = null;

  if (choice) {
    const { chosenCategoryName, reasoning } = choice;
    const matchedCategory = userCategories.find(
      (cat) => cat.name.toLowerCase() === chosenCategoryName.toLowerCase()
    );
    if (matchedCategory) {
      determinedCategoryId = matchedCategory._id;
      console.log(
        `[CategorizationService] LLM chose category: "${chosenCategoryName}", ID: ${determinedCategoryId}. Reasoning: "${reasoning}"`
      );
    } else {
      console.warn(
        `[CategorizationService] LLM chose category name "${chosenCategoryName}" but it does not match any existing categories for user ${userId}. Reasoning: "${reasoning}"`
      );
    }
  } else {
    console.log('[CategorizationService] LLM did not choose a category.');
  }

  // console.log(`[CategorizationService] Final determined categoryId: ${determinedCategoryId}`);
  return { categoryId: determinedCategoryId };
}
