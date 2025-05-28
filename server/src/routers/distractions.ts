import { z } from 'zod';
import { User } from '../models/user';
import { determineDistraction } from '../services/distractions';
import { publicProcedure, router } from '../trpc';
import { verifyToken } from './auth';

// Zod schema for ActiveWindowDetails, matching shared/types.ts
const activeWindowDetailsSchema = z.object({
  windowId: z.number(),
  ownerName: z.string(),
  type: z.enum(['window', 'browser']),
  browser: z.enum(['chrome', 'safari']).optional().nullable(),
  title: z.string(),
  url: z.string().optional().nullable(),
  content: z.string().optional().nullable(), // Added content
  timestamp: z.number().optional(), // Added timestamp
  // localScreenshotPath and screenshotS3Url are optional and can be omitted if not sent by client
});

export const distractionsRouter = router({
  checkDistraction: publicProcedure
    .input(
      z.object({
        token: z.string(),
        activeWindowDetails: activeWindowDetailsSchema, // Use the detailed schema
      })
    )
    .query(async ({ input }) => {
      const decoded = verifyToken(input.token);
      const userId = decoded.userId;

      // Get user's goals
      const user = await User.findById(userId).select('userGoals');
      if (!user) {
        throw new Error('User not found');
      }

      const userGoals = user.userGoals || {
        weeklyGoal: '',
        dailyGoal: '',
        lifeGoal: '',
      };

      // Check if the activity is distracting
      const result = await determineDistraction(userGoals, input.activeWindowDetails);

      return result;
    }),
});
