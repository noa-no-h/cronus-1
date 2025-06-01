import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { ActiveWindowEvent } from '../../../shared/types';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { publicProcedure, router } from '../trpc';

// Zod schema for input validation
const activeWindowEventInputSchema = z.object({
  userId: z.string(),
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
    const eventToSave: ActiveWindowEvent = {
      ...input,
    };

    try {
      const newEvent = new ActiveWindowEventModel(eventToSave);

      console.log(`[${newEvent.timestamp}] newEvent: ${newEvent.ownerName || newEvent.title}`);

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
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        // Get start and end of today in UTC
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const events = await ActiveWindowEventModel.find({
          userId: input.userId,
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
});
