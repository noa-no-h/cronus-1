import { ActiveWindowDetails } from '../../../shared/types'; // Assuming User might be needed later for goals
// Import other necessary models like CategoryModel if needed for rules, etc.

interface CategorizationResult {
  categoryId: string | null;
  // We might add more details later, e.g., if a new category was suggested or why it was categorized as such.
}

/**
 * Determines the category for a given active window event.
 * This will eventually involve:
 * - Checking a cache of previously categorized similar activities.
 * - Applying user-defined rules or preferences.
 * - Using an LLM for more complex categorization if necessary.
 * - Fetching user goals to influence categorization.
 */
export async function categorizeActivity(
  userId: string,
  activeWindow: Omit<
    ActiveWindowDetails,
    | 'userId'
    | 'windowId'
    | 'timestamp'
    | 'localScreenshotPath'
    | 'screenshotS3Url'
    | 'captureReason'
  >
): Promise<CategorizationResult> {
  console.log(
    `[CategorizationService] Attempting to categorize activity for user ${userId}:`,
    activeWindow.ownerName,
    activeWindow.title
  );

  // TODO: Implement caching logic:
  // 1. Construct a cache key (e.g., based on userId, url, ownerName).
  // 2. Check if a similar event has been categorized recently for this user.
  //    - Query ActiveWindowEventModel for entries with the same URL (if browser) or ownerName.
  //    - If consistent categoryId found, use it.
  //    - If conflicting or no entries, proceed to fuller categorization.

  // TODO: Implement fetching user goals (from UserModel using userId).
  // const user = await UserModel.findById(userId).select('userGoals');
  // const userGoals = user?.userGoals || { weeklyGoal: '', dailyGoal: '', lifeGoal: '' };

  // TODO: Implement actual categorization logic (e.g., calling a refined determineDistraction or LLM).
  // For now, returning null.
  const determinedCategoryId: string | null = null;

  console.log(`[CategorizationService] Determined categoryId: ${determinedCategoryId}`);
  return { categoryId: determinedCategoryId };
}
