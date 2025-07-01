import { Types } from 'mongoose';
import { ActiveWindowEventModel } from '../../models/activeWindowEvent';
import { ActivityEventSuggestionModel } from '../../models/activityEventSuggestion';
import { categorizeActivity } from '../categorization/categorizationService';

// This should ideally be a shared type. For now, defined here.
export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  startTime: number; // Unix timestamp ms
  endTime: number; // Unix timestamp ms
}

export async function generateSuggestionsForUser(userId: string, calendarEvents: CalendarEvent[]) {
  if (!calendarEvents || calendarEvents.length === 0) {
    return { created: 0 };
  }

  // 1. Get date range from calendar events to narrow down DB queries
  const minStartTime = Math.min(...calendarEvents.map((e) => e.startTime));
  const maxEndTime = Math.max(...calendarEvents.map((e) => e.endTime));

  // 2. Fetch existing activities and suggestions in that range to avoid duplicates
  const [existingActivities, existingSuggestions] = await Promise.all([
    ActiveWindowEventModel.find({
      userId,
      timestamp: { $gte: minStartTime, $lt: maxEndTime },
    })
      .select('timestamp')
      .lean(),
    ActivityEventSuggestionModel.find({
      userId,
      googleCalendarEventId: { $in: calendarEvents.map((e) => e.id) },
    }).lean(),
  ]);

  const existingSuggestionIds = new Set(existingSuggestions.map((s) => s.googleCalendarEventId));

  // 3. Filter for calendar events that are eligible for a new suggestion
  const now = Date.now();
  const eventsToSuggest = calendarEvents.filter((event) => {
    // Rule out if the event is in the future
    if (event.endTime > now) {
      return false;
    }

    // Rule out if suggestion already exists
    if (existingSuggestionIds.has(event.id)) {
      return false;
    }
    // Rule out if the calendar event's time slot is already occupied by any activity
    const hasOverlappingActivity = existingActivities.some(
      (activity) => activity.timestamp >= event.startTime && activity.timestamp < event.endTime
    );
    return !hasOverlappingActivity;
  });

  if (eventsToSuggest.length === 0) {
    return { created: 0 };
  }

  // 4. Create suggestions for the filtered events
  const suggestionsToCreate = await Promise.all(
    eventsToSuggest.map(async (event) => {
      // a. Use AI to pick a category
      const categorizationResult = await categorizeActivity(userId, {
        ownerName: event.summary,
        title: event.summary,
        url: '',
        content: event.description || '',
        type: 'manual',
        browser: null,
      });

      // b. Prepare the suggestion object for DB insertion
      return {
        userId: new Types.ObjectId(userId),
        googleCalendarEventId: event.id,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        name: event.summary,
        suggestedCategoryId: categorizationResult.categoryId
          ? new Types.ObjectId(categorizationResult.categoryId)
          : undefined,
        status: 'pending' as const,
        reasoning: categorizationResult.categoryReasoning || undefined,
      };
    })
  );

  if (suggestionsToCreate.length > 0) {
    try {
      // Use insertMany for efficiency and ignore errors for duplicate keys
      // which can happen in race conditions.
      await ActivityEventSuggestionModel.insertMany(suggestionsToCreate, { ordered: false });
    } catch (error: any) {
      // We expect a bulk write error with duplicate key errors (code 11000)
      // if another process creates the same suggestion(s) between our check and our insert.
      // We can ignore these specific errors.
      if (error.code !== 11000 && !error.message.includes('E11000')) {
        console.error(`Error creating suggestions:`, error);
      }
    }
  }
  return { created: suggestionsToCreate.length };
}
