import { z } from 'zod';
import { UserModel } from '../models/user';
import { GoogleCalendarService } from '../services/googleCalendar';
import { publicProcedure, router } from '../trpc';
import { verifyToken } from './auth';

export const calendarRouter = router({
  getEvents: publicProcedure
    .input(
      z.object({
        token: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const decodedToken = verifyToken(input.token);
      const user = await UserModel.findById(decodedToken.userId);

      if (!user?.hasCalendarAccess || !user.googleAccessToken) {
        return [];
      }

      const calendarService = new GoogleCalendarService();
      return await calendarService.getCalendarEvents(
        user.googleAccessToken,
        user.googleRefreshToken!,
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),

  hasCalendarAccess: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const decodedToken = verifyToken(input.token);
      const user = await UserModel.findById(decodedToken.userId);
      return { hasAccess: user?.hasCalendarAccess || false };
    }),
});
