import { afterEach, beforeEach, describe, expect, jest, mock, test } from 'bun:test';
import { Types } from 'mongoose';
import { CalendarEvent, generateSuggestionsForUser } from './suggestionGenerationService';

// Mock dependencies
const mockActiveWindowEventModel = {
  find: jest.fn(),
};
mock.module('../../models/activeWindowEvent', () => ({
  ActiveWindowEventModel: mockActiveWindowEventModel,
}));

const mockActivityEventSuggestionModel = {
  find: jest.fn(),
  insertMany: jest.fn(),
};
mock.module('../../models/activityEventSuggestion', () => ({
  ActivityEventSuggestionModel: mockActivityEventSuggestionModel,
}));

const mockCategorizationService = {
  categorizeActivity: jest.fn(),
};
mock.module('../categorization/categorizationService', () => mockCategorizationService);

// Import mocks after mock.module calls
const { ActiveWindowEventModel } = await import('../../models/activeWindowEvent');
const { ActivityEventSuggestionModel } = await import('../../models/activityEventSuggestion');
const { categorizeActivity } = await import('../categorization/categorizationService');

describe('generateSuggestionsForUser', () => {
  const userId = new Types.ObjectId().toString();
  const today = new Date('2024-01-01T00:00:00.000Z');

  const createDate = (hour: number, minute: number) =>
    new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute)
    ).getTime();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should create a suggestion for a calendar event with no overlapping activities (screenshot scenario)', async () => {
    // ARRANGE
    const calendarEvents: CalendarEvent[] = [
      {
        id: 'cal-event-1',
        summary: 'Workout',
        description: '',
        startTime: createDate(6, 30),
        endTime: createDate(7, 0),
      },
    ];

    const existingActivities = [
      {
        _id: new Types.ObjectId(),
        userId,
        timestamp: createDate(7, 15), // Starts after the calendar event
        durationMs: 15 * 60 * 1000,
        ownerName: 'some-app',
      },
    ];

    (ActiveWindowEventModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(existingActivities),
    });
    (ActivityEventSuggestionModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    }); // No existing suggestions
    const mockCategorization = {
      categoryId: new Types.ObjectId().toString(),
      categoryReasoning: 'AI suggested this based on event title',
    };
    (categorizeActivity as jest.Mock).mockResolvedValue(mockCategorization);

    // ACT
    await generateSuggestionsForUser(userId, calendarEvents);

    // ASSERT
    expect(ActivityEventSuggestionModel.insertMany).toHaveBeenCalledTimes(1);
    const suggestions = (ActivityEventSuggestionModel.insertMany as jest.Mock).mock.calls[0][0];
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].name).toBe('Workout');
    expect(suggestions[0].suggestedCategoryId.toString()).toBe(mockCategorization.categoryId);
    expect(suggestions[0].startTime.getTime()).toBe(calendarEvents[0].startTime);
  });

  test('should NOT create a suggestion for a calendar event that overlaps with an existing activity', async () => {
    // ARRANGE
    const calendarEvents: CalendarEvent[] = [
      {
        id: 'cal-event-1',
        summary: 'Workout',
        description: '',
        startTime: createDate(6, 30),
        endTime: createDate(7, 0),
      },
    ];

    const existingActivities = [
      {
        _id: new Types.ObjectId(),
        userId,
        timestamp: createDate(6, 45), // Overlaps with the workout
        durationMs: 30 * 60 * 1000,
        ownerName: 'some-app',
      },
    ];

    (ActiveWindowEventModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(existingActivities),
    });
    (ActivityEventSuggestionModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });

    // ACT
    const result = await generateSuggestionsForUser(userId, calendarEvents);

    // ASSERT
    expect(ActivityEventSuggestionModel.insertMany).not.toHaveBeenCalled();
    expect(result.created).toBe(0);
  });

  test('should NOT create a suggestion for a calendar event that already has a suggestion', async () => {
    // ARRANGE
    const calendarEvents: CalendarEvent[] = [
      {
        id: 'cal-event-1',
        summary: 'Workout',
        description: '',
        startTime: createDate(6, 30),
        endTime: createDate(7, 0),
      },
    ];

    const existingSuggestions = [
      {
        googleCalendarEventId: 'cal-event-1',
      },
    ];

    (ActiveWindowEventModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    (ActivityEventSuggestionModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(existingSuggestions),
    });

    // ACT
    const result = await generateSuggestionsForUser(userId, calendarEvents);

    // ASSERT
    expect(ActivityEventSuggestionModel.insertMany).not.toHaveBeenCalled();
    expect(result.created).toBe(0);
  });

  test('should create multiple suggestions if multiple calendar events are eligible', async () => {
    // ARRANGE
    const calendarEvents: CalendarEvent[] = [
      {
        id: 'cal-event-1',
        summary: 'Workout',
        description: '',
        startTime: createDate(6, 30),
        endTime: createDate(7, 0),
      },
      {
        id: 'cal-event-2',
        summary: 'Team Standup',
        description: '',
        startTime: createDate(9, 0),
        endTime: createDate(9, 30),
      },
    ];

    (ActiveWindowEventModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }); // No activities at all
    (ActivityEventSuggestionModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    (categorizeActivity as jest.Mock).mockResolvedValue({
      categoryId: new Types.ObjectId().toString(),
    });

    // ACT
    await generateSuggestionsForUser(userId, calendarEvents);

    // ASSERT
    expect(ActivityEventSuggestionModel.insertMany).toHaveBeenCalledTimes(1);
    const suggestions = (ActivityEventSuggestionModel.insertMany as jest.Mock).mock.calls[0][0];
    expect(suggestions).toHaveLength(2);
  });
});
