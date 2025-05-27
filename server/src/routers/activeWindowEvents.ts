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
});
