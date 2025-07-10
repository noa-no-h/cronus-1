import { ActiveWindowDetails, Category as CategoryType } from '../../../../shared/types';
import { logToFile } from '../../lib/logger';
import { CategoryModel } from '../../models/category';
import { UserModel } from '../../models/user';
import { checkActivityHistory } from './history';
import { getOpenAICategoryChoice, getOpenAISummaryForBlock } from './llm';

interface CategorizationResult {
  categoryId: string | null;
  categoryReasoning: string | null;
}

export async function categorizeActivity(
  userId: string,
  activeWindow: Pick<
    ActiveWindowDetails,
    'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser' | 'durationMs'
  >
): Promise<CategorizationResult> {
  await logToFile('categorizeActivity called', { userId, activeWindow });
  // 1. History Check
  const historyResult = await checkActivityHistory(userId, activeWindow);
  if (historyResult) {
    return historyResult;
  }

  // 2. LLM-based Categorization by choosing from user's list
  const user = await UserModel.findById(userId).select('userProjectsAndGoals').lean();
  const userProjectsAndGoals: string = user?.userProjectsAndGoals || '';

  const rawUserCategories = await CategoryModel.find({ userId, isArchived: { $ne: true } }).lean();
  const userCategories: CategoryType[] = rawUserCategories.map((cat) => ({
    ...cat,
    _id: cat._id.toString(),
    userId: cat.userId.toString(),
  }));

  if (!userCategories || userCategories.length === 0) {
    console.warn(
      `[CategorizationService] User ${userId} has no categories defined. Cannot categorize.`
    );
    return { categoryId: null, categoryReasoning: null };
  }

  const categoryNamesForLLM = userCategories.map((c) => ({
    name: c.name,
    description: c.description,
  }));

  // TODO: grab the content (or first x chars of it) to increase precision
  // TODO-maybe: could add "unclear" here and then check the screenshot etc
  const choice = await getOpenAICategoryChoice(
    userProjectsAndGoals,
    categoryNamesForLLM,
    activeWindow
  );

  let determinedCategoryId: string | null = null;
  let categoryReasoning: string | null = null;

  if (choice) {
    const { chosenCategoryName, reasoning } = choice;
    const matchedCategory = userCategories.find(
      (cat) => cat.name.toLowerCase() === chosenCategoryName.toLowerCase()
    );
    if (matchedCategory) {
      determinedCategoryId = matchedCategory._id;
      categoryReasoning = reasoning;
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

  // Fallback: If reasoning is missing or too short, and block is "long" (e.g., >10min)
  const isLongBlock = activeWindow.durationMs && activeWindow.durationMs > 10 * 60 * 1000; // 10 minutes
  const isReasoningMissingOrShort = !categoryReasoning || categoryReasoning.length < 10;

  if (isLongBlock && isReasoningMissingOrShort) {
    const summary = await getOpenAISummaryForBlock(activeWindow);
    if (summary) {
      categoryReasoning = summary;
    }
  }

  return { categoryId: determinedCategoryId, categoryReasoning };
}
