import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { ActiveWindowDetails, Category as CategoryType } from '../../../shared/types';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { CategoryModel } from '../models/category';
import { User as UserModel } from '../models/user';

const openai = new OpenAI(); // Ensure OPENAI_API_KEY is set

// NEW Zod schema for LLM output: Expecting the name of one of the user's categories
const CategoryChoiceSchema = z.object({
  chosenCategoryName: z.string(),
  // We could add a brief reasoning from the LLM if desired, e.g., whyItChoseThisCategory: z.string().optional()
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
  const MAX_CONTENT_LENGTH = 200;
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
    truncatedContent && `Content Snippet: ${truncatedContent}`,
    type && `Type: ${type}`,
    browser && `Browser: ${browser}`,
  ]
    .filter(Boolean)
    .join('\n    ');

  return [
    {
      role: 'system' as const,
      content:
        "You are an AI assistant. Based on the user's goals, their current activity, and their list of personal categories, choose the category name that best fits the activity. Only output one category name from the provided list.",
    },
    {
      role: 'user' as const,
      content: `
            User Goals:
            - Life Goal: "${lifeGoal || 'Not set'}"
            - Weekly Goal: "${weeklyGoal || 'Not set'}"
            - Daily Goal: "${dailyGoal || 'Not set'}"

            User's Defined Categories:
            ${categoryListForPrompt}

            User's Current Activity:
            ${activityDetailsString}

            Instruction: Which of the user's defined categories (listed above) does this activity best fit into? Respond with ONLY the category name.
          `,
    },
  ];
}

async function getOpenAICategoryChoice(
  userGoals: UserGoals,
  userCategories: Pick<CategoryType, 'name' | 'description'>[], // Pass only name and description for the prompt
  activityDetails: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
  >
): Promise<string | null> {
  // Returns the chosen category NAME or null if error/no choice
  const promptInput = _buildOpenAICategoryChoicePromptInput(
    userGoals,
    userCategories,
    activityDetails
  );

  try {
    const response = await openai.responses.parse({
      model: 'gpt-4o-2024-08-06',
      input: promptInput,
      text: {
        format: zodTextFormat(CategoryChoiceSchema, 'category_choice'),
      },
    });

    if (!response.output_parsed || 'refusal' in response.output_parsed) {
      console.warn('OpenAI response issue or refusal selecting category:', response.output_parsed);
      return null;
    }
    return response.output_parsed.chosenCategoryName;
  } catch (error) {
    console.error('Error getting OpenAI category choice:', error);
    return null;
  }
}

async function checkActivityHistory(
  userId: string,
  activeWindow: Pick<ActiveWindowDetails, 'ownerName' | 'url' | 'type'>
): Promise<string | null> {
  // TODO: Refine history check logic (e.g., consistency over multiple recent events, time decay)
  try {
    const queryCondition: any = { userId };
    if (activeWindow.url && activeWindow.type === 'browser') {
      queryCondition.url = activeWindow.url;
    } else {
      queryCondition.ownerName = activeWindow.ownerName;
    }
    const lastEventWithSameIdentifier = await ActiveWindowEventModel.findOne(queryCondition)
      .sort({ timestamp: -1 })
      .select('categoryId')
      .lean();

    if (lastEventWithSameIdentifier && lastEventWithSameIdentifier.categoryId) {
      console.log(
        `[CategorizationService] History check found categoryId: ${lastEventWithSameIdentifier.categoryId} for ${activeWindow.ownerName || activeWindow.url}`
      );
      return lastEventWithSameIdentifier.categoryId as string;
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
  console.log(
    `[CategorizationService] Categorizing for user ${userId}: ${activeWindow.ownerName} - ${activeWindow.title || activeWindow.url}`
  );

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
  const chosenCategoryName = await getOpenAICategoryChoice(
    userGoals,
    categoryNamesForLLM,
    activeWindow
  );

  let determinedCategoryId: string | null = null;

  if (chosenCategoryName) {
    const matchedCategory = userCategories.find(
      (cat) => cat.name.toLowerCase() === chosenCategoryName.toLowerCase()
    );
    if (matchedCategory) {
      determinedCategoryId = matchedCategory._id;
      console.log(
        `[CategorizationService] LLM chose category: "${chosenCategoryName}", ID: ${determinedCategoryId}`
      );
    } else {
      console.warn(
        `[CategorizationService] LLM chose category name "${chosenCategoryName}" but it does not match any existing categories for user ${userId}.`
      );
    }
  } else {
    console.log('[CategorizationService] LLM did not choose a category.');
  }

  console.log(`[CategorizationService] Final determined categoryId: ${determinedCategoryId}`);
  return { categoryId: determinedCategoryId };
}
