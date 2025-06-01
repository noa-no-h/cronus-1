import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { ActiveWindowEvent } from '../../../shared/types';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { categorizeActivity } from '../services/categorizationService';
import { publicProcedure, router } from '../trpc';
import { verifyToken } from './auth';

// Zod schema for input validation
const activeWindowEventInputSchema = z.object({
  token: z.string(),
  windowId: z.number(),
  ownerName: z.string(),
  type: z.enum(['window', 'browser']),
  browser: z.enum(['chrome', 'safari']).optional().nullable(),
  title: z.string(),
  url: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  timestamp: z.number(),
  screenshotS3Url: z.string().optional().nullable(),
});

export const activeWindowEventsRouter = router({
  create: publicProcedure.input(activeWindowEventInputSchema).mutation(async ({ input }) => {
    const decodedToken = verifyToken(input.token);
    const userId = decodedToken.userId;

    // Destructure relevant details from input for categorization
    const { windowId, ownerName, type, browser, title, url, content, timestamp, screenshotS3Url } =
      input;
    const activityDetails = { ownerName, type, browser, title, url, content }; // Pass only necessary fields

    const categorizationResult = await categorizeActivity(userId, activityDetails);
    const categoryId = categorizationResult.categoryId;

    const eventToSave: ActiveWindowEvent = {
      userId,
      windowId,
      ownerName,
      type,
      browser,
      title,
      url,
      content,
      timestamp,
      screenshotS3Url,
      categoryId, // Add categoryId from categorization service
    };

    try {
      const newEvent = new ActiveWindowEventModel(eventToSave);

      console.log(
        `[${new Date(newEvent?.timestamp || 0).toISOString().split('T')[1].split('.')[0]}] newEvent: ${newEvent.ownerName || newEvent.title}`
      );

      await newEvent.save();
      return newEvent.toObject() as ActiveWindowEvent;
    } catch (error) {
      console.error('Error saving active window event:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to save active window event',
      });
    }
  }),

  getTodayEvents: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const decodedToken = verifyToken(input.token);
        const userId = decodedToken.userId;

        // Get start and end of today in UTC
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const events = await ActiveWindowEventModel.find({
          userId: userId,
          timestamp: {
            $gte: startOfDay.getTime(),
            $lt: endOfDay.getTime(),
          },
        }).sort({ timestamp: 1 });

        return events.map((event) => event.toObject() as ActiveWindowEvent);
      } catch (error) {
        console.error("Error fetching today's events:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Failed to fetch today's events",
        });
      }
    }),

  getLatestEvent: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const decodedToken = verifyToken(input.token);
        const userId = decodedToken.userId;

        const latestEvent = await ActiveWindowEventModel.findOne({
          userId: userId,
        })
          .sort({ timestamp: -1 })
          .limit(1);

        if (!latestEvent) {
          return null; // Or throw a TRPCError if an event is always expected
        }
        return latestEvent.toObject() as ActiveWindowEvent;
      } catch (error) {
        console.error('Error fetching latest event:', error);
        // Handle token verification errors specifically if verifyToken throws them
        if (
          error instanceof Error &&
          (error.message.includes('jwt') || error.message.includes('token'))
        ) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token.',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch latest event',
        });
      }
    }),
});
