import { ActiveWindowDetails } from '../../../../shared/types';
import { ActiveWindowEventModel } from '../../models/activeWindowEvent';

export async function checkActivityHistory(
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
      // const category = await CategoryModel.findById(categoryId).select('name').lean();
      // const categoryName = category ? category.name : 'Unknown Category';
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
