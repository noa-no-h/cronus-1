import { TRPCError } from '@trpc/server';
import { endOfDay, startOfDay } from 'date-fns';
import { z } from 'zod';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { ActivityEventSuggestionModel } from '../models/activityEventSuggestion';
import { Category } from '../models/category';
import { getCalendarEvents } from '../services/googleCalendar';
import {
  CalendarEvent,
  generateSuggestionsForUser,
} from '../services/suggestions/suggestionGenerationService';
import { publicProcedure, router } from '../trpc';
import { verifyToken } from './auth';

export const suggestionsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        token: z.string(),
        startTime: z.number(),
        endTime: z.number(),
      })
    )
    .query(async ({ input }) => {
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;

      const suggestions = await ActivityEventSuggestionModel.find({
        userId,
        status: 'pending',
        startTime: { $gte: new Date(input.startTime) },
        endTime: { $lte: new Date(input.endTime) },
      })
        .populate<{ suggestedCategoryId: Category }>('suggestedCategoryId')
        .lean();

      return suggestions.map((s) => ({
        ...s,
        categoryColor: s.suggestedCategoryId?.color,
        categoryName: s.suggestedCategoryId?.name,
      }));
    }),

  accept: publicProcedure
    .input(
      z.object({
        token: z.string(),
        suggestionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;

      const suggestion = await ActivityEventSuggestionModel.findOne({
        _id: input.suggestionId,
        userId,
      });

      if (!suggestion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Suggestion not found or access denied.',
        });
      }

      // 1. Create a new manual ActiveWindowEvent from the suggestion
      const newEvent = new ActiveWindowEventModel({
        userId,
        ownerName: suggestion.name,
        title: suggestion.name,
        type: 'manual',
        timestamp: suggestion.startTime.getTime(),
        windowId: 0,
        browser: null,
        url: '',
        content: '',
        screenshotS3Url: '',
        categoryId: suggestion.suggestedCategoryId,
        durationMs: suggestion.endTime.getTime() - suggestion.startTime.getTime(),
      });
      await newEvent.save();

      // 2. Update the suggestion status to 'accepted'
      suggestion.status = 'accepted';
      await suggestion.save();

      return newEvent.toObject();
    }),

  reject: publicProcedure
    .input(
      z.object({
        token: z.string(),
        suggestionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;

      const result = await ActivityEventSuggestionModel.updateOne(
        { _id: input.suggestionId, userId },
        { $set: { status: 'rejected' } }
      );

      if (result.matchedCount === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Suggestion not found or access denied.',
        });
      }

      return { success: true };
    }),

  generateForDay: publicProcedure
    .input(
      z.object({
        token: z.string(),
        date: z.number(), // Expecting a timestamp for the day
      })
    )
    .mutation(async ({ input }) => {
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;

      const day = new Date(input.date);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const rawCalendarEvents = await getCalendarEvents(userId, dayStart, dayEnd);

      const transformedEvents = rawCalendarEvents
        .map((e) => {
          if (!e.id || !e.summary || !e.start?.dateTime || !e.end?.dateTime) {
            return null;
          }
          return {
            id: e.id,
            summary: e.summary,
            description: e.description || '',
            startTime: new Date(e.start.dateTime).getTime(),
            endTime: new Date(e.end.dateTime).getTime(),
          };
        })
        .filter((e): e is CalendarEvent => e !== null);

      const result = await generateSuggestionsForUser(userId, transformedEvents);

      return { success: true, ...result };
    }),
});

export type SuggestionsRouter = typeof suggestionsRouter;
