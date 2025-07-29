import { FilterQuery } from 'mongoose';
import { ActiveWindowEvent } from 'shared';
import { ActiveWindowEventModel, IActiveWindowEvent } from '../../models/activeWindowEvent';

/**
 * Updates the category of events in a given date range for a user.
 * - If the activity is a 'website' and has a URL, matches all events with that exact URL (regardless of title).
 * - If the activity is a 'website' and has no URL, matches by title and ownerName.
 * - If the activity is an 'app', matches by ownerName.
 *
 * @param params - The parameters for the update operation.
 * @returns The result of the update operation.
 */
export async function updateEventCategoryInDateRange(params: {
  userId: string;
  startDateMs: number;
  endDateMs: number;
  activityIdentifier: string;
  itemType: 'app' | 'website';
  newCategoryId: string;
}): Promise<{ success: boolean; updatedCount: number; latestEvent: ActiveWindowEvent | null }> {
  const { userId, startDateMs, endDateMs, activityIdentifier, itemType, newCategoryId } = params;

  const filter: FilterQuery<IActiveWindowEvent> = {
    userId,
    timestamp: {
      $gte: new Date(startDateMs),
      $lte: new Date(endDateMs),
    },
  };

  if (itemType === 'app') {
    filter.ownerName = activityIdentifier;
  } else {
    // For 'website' type, we first need to determine if we match by URL or by title.
    // We'll peek at one of the events to decide.
    const sampleEvent = await ActiveWindowEventModel.findOne({
      userId,
      timestamp: { $gte: new Date(startDateMs), $lte: new Date(endDateMs) },
      $or: [{ url: activityIdentifier }, { title: activityIdentifier }],
    }).lean();

    // Prioritize URL matching if the identifier looks like a URL or if the sample event has a URL
    const isUrlLikely = activityIdentifier.startsWith('http') || (sampleEvent && sampleEvent.url);

    if (isUrlLikely) {
      filter.url = activityIdentifier;
    } else {
      // Fallback to title match for events without a URL
      filter.title = activityIdentifier;
      // Also match ownerName to avoid moving e.g. a Safari window and a Chrome window with the same title
      const sampleBrowserEvent = await ActiveWindowEventModel.findOne({
        userId,
        title: activityIdentifier,
        timestamp: { $gte: new Date(startDateMs), $lte: new Date(endDateMs) },
      }).lean();
      if (sampleBrowserEvent) {
        filter.ownerName = sampleBrowserEvent.ownerName;
      }

      filter.$or = [{ url: null }, { url: '' }];
    }
  }

  const result = await ActiveWindowEventModel.updateMany(filter, [
    {
      $set: {
        oldCategoryId: '$categoryId',
        oldCategoryReasoning: '$categoryReasoning',
        oldLlmSummary: '$llmSummary',
        categoryId: newCategoryId,
        categoryReasoning: 'Updated manually',
        llmSummary: null,
        lastCategorizationAt: new Date(),
      },
    },
  ]);

  let latestEvent: ActiveWindowEvent | null = null;
  if (result.modifiedCount > 0) {
    const latestUpdatedEvent = await ActiveWindowEventModel.findOne(filter)
      .sort({
        timestamp: -1,
      })
      .lean();
    if (latestUpdatedEvent) {
      latestEvent = {
        ...latestUpdatedEvent,
        _id: latestUpdatedEvent._id.toString(),
      } as ActiveWindowEvent;
    }
  }

  return {
    success: true,
    updatedCount: result.modifiedCount,
    latestEvent,
  };
}
