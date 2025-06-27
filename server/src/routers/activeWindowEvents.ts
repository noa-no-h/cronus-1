import { TRPCError } from '@trpc/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ActiveWindowEvent } from '../../../shared/types';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { categorizeActivity } from '../services/categorization/categorizationService';
import { publicProcedure, router } from '../trpc';
import { verifyToken } from './auth';

// Zod schema for input validation
const activeWindowEventInputSchema = z.object({
  token: z.string(),
  windowId: z.number().optional(),
  ownerName: z.string(),
  type: z.enum(['window', 'browser', 'system']),
  browser: z.enum(['chrome', 'safari']).optional().nullable(),
  title: z.string(),
  url: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  timestamp: z.number(),
  screenshotS3Url: z.string().optional().nullable(),
});

export const activeWindowEventsRouter = router({
  create: publicProcedure.input(activeWindowEventInputSchema).mutation(async ({ input }) => {
    console.log('input in create activeWindowEventsRouter', JSON.stringify(input, null, 2));

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
        `[${new Date(newEvent?.timestamp || 0).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}] newEvent: ${newEvent.ownerName || newEvent.title}`
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

  getEventsForDateRange: publicProcedure
    .input(z.object({ token: z.string(), startDateMs: z.number(), endDateMs: z.number() }))
    .query(async ({ input }) => {
      try {
        const decodedToken = verifyToken(input.token);
        const userId = decodedToken.userId;

        // Input times are already UTC milliseconds representing the user's local day/week boundaries
        const { startDateMs, endDateMs } = input;

        if (startDateMs >= endDateMs) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'startDateMs must be before endDateMs.',
          });
        }

        const events = await ActiveWindowEventModel.find({
          userId: userId,
          timestamp: {
            $gte: startDateMs,
            $lt: endDateMs,
          },
        }).sort({ timestamp: 1 });

        return events.map((event) => event.toObject() as ActiveWindowEvent);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('Error fetching events for date range:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch events for date range',
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

  updateEventsCategoryInDateRange: publicProcedure
    .input(
      z.object({
        token: z.string(),
        startDateMs: z.number(),
        endDateMs: z.number(),
        activityIdentifier: z.string(), // ownerName for app, domain for website
        itemType: z.enum(['app', 'website']),
        newCategoryId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
          message: 'Invalid Object ID for newCategoryId',
        }),
      })
    )
    .mutation(async ({ input }) => {
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;

      const { startDateMs, endDateMs, activityIdentifier, itemType, newCategoryId } = input;

      const queryConditions: any = {
        userId: userId,
        timestamp: {
          $gte: startDateMs,
          $lt: endDateMs,
        },
      };

      if (itemType === 'app') {
        queryConditions.ownerName = activityIdentifier;
      } else {
        // itemType === 'website'
        // Function to escape special characters for regex
        const escapeRegExp = (string: string): string => {
          return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
        };
        const escapedIdentifier = escapeRegExp(activityIdentifier);

        queryConditions.$or = [
          // Option 1: activityIdentifier is a domain present in a URL
          { url: { $regex: `(^|[^A-Za-z0-9_])${escapedIdentifier}([:\\/]|$)`, $options: 'i' } },
          // Option 2: activityIdentifier is a title, for a browser event where URL is null or empty
          {
            title: activityIdentifier, // Exact match for title
            ownerName: {
              $in: [
                'Google Chrome',
                'Chrome',
                'Safari',
                'Firefox',
                'firefox',
                'Microsoft Edge',
                'msedge',
                'Brave Browser',
                'Brave',
                'Opera',
                'opera',
                'Vivaldi',
                'Arc',
                // Add more browser ownerNames if needed
              ],
            },
            $or: [{ url: null }, { url: '' }], // URL is either null or an empty string
          },
        ];
      }

      console.log(
        'queryConditions in updateEventsCategoryInDateRange',
        JSON.stringify(queryConditions, null, 2)
      );

      try {
        const updateResult = await ActiveWindowEventModel.updateMany(queryConditions, {
          $set: { categoryId: newCategoryId },
        });

        console.log(
          `[EventsRouter] Updated ${updateResult.modifiedCount} events for user ${userId} to category ${newCategoryId} for identifier "${activityIdentifier}"`
        );
        return {
          success: true,
          updatedCount: updateResult.modifiedCount,
        };
      } catch (error) {
        console.error('[EventsRouter] Error updating event categories:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update event categories in date range.',
        });
      }
    }),

  createManual: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string(),
        categoryId: z.string().optional(),
        startTime: z.number(),
        endTime: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const decodedToken = verifyToken(input.token);
      const userId = decodedToken.userId;

      const { name, categoryId, startTime, endTime } = input;

      const eventToSave: ActiveWindowEvent = {
        userId,
        ownerName: name,
        title: name,
        type: 'manual',
        timestamp: startTime,
        // Manual entries won't have these, but the schema expects them
        windowId: 0,
        browser: null,
        url: '',
        content: '',
        screenshotS3Url: '',
        // These fields are crucial
        categoryId,
        // We can store the duration if needed, or calculate it on the fly
        durationMs: endTime - startTime,
      };

      console.log('eventToSave in createManual', JSON.stringify(eventToSave, null, 2));

      try {
        const newEvent = new ActiveWindowEventModel(eventToSave);
        await newEvent.save();
        return newEvent.toObject() as ActiveWindowEvent;
      } catch (error) {
        console.error('Error saving manual window event:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save manual window event',
        });
      }
    }),

  updateManual: publicProcedure
    .input(
      z.object({
        token: z.string(),
        id: z.string(),
        name: z.string().optional(),
        categoryId: z.string().optional(),
        startTime: z.number().optional(),
        durationMs: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { token, id, name, categoryId, startTime, durationMs } = input;
      verifyToken(token);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      if (name) {
        updateData.name = name;
        // Also update ownerName and title for consistency if they exist on the model
        updateData.ownerName = name;
        updateData.title = name;
      }
      if (categoryId) updateData.categoryId = categoryId;
      if (startTime) updateData.timestamp = startTime;
      if (durationMs) updateData.durationMs = durationMs;

      try {
        const updatedEvent = await ActiveWindowEventModel.findByIdAndUpdate(id, updateData, {
          new: true,
        });
        if (!updatedEvent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        return updatedEvent.toObject() as ActiveWindowEvent;
      } catch (error) {
        console.error('Error updating manual window event:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update manual window event',
        });
      }
    }),

  deleteManual: publicProcedure
    .input(z.object({ token: z.string(), id: z.string() }))
    .mutation(async ({ input }) => {
      const { token, id } = input;
      verifyToken(token);

      try {
        const deletedEvent = await ActiveWindowEventModel.findByIdAndDelete(id);
        if (!deletedEvent) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        return { success: true };
      } catch (error) {
        console.error('Error deleting manual window event:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete manual window event',
        });
      }
    }),
});
