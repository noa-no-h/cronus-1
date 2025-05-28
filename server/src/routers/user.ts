import { z } from 'zod';
import { User } from '../models/user';
import { publicProcedure, router } from '../trpc';
import { verifyToken } from './auth';

export const userRouter = router({
  updateElectronAppSettings: publicProcedure
    .input(
      z.object({
        token: z.string(),
        calendarZoomLevel: z.number().min(40).max(120).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const decoded = verifyToken(input.token);
      const userId = decoded.userId;

      const updateData: any = {};
      if (input.calendarZoomLevel !== undefined) {
        updateData['electronAppSettings.calendarZoomLevel'] = input.calendarZoomLevel;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return {
        success: true,
        electronAppSettings: updatedUser.electronAppSettings,
      };
    }),

  getElectronAppSettings: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const decoded = verifyToken(input.token);
      const userId = decoded.userId;

      const user = await User.findById(userId).select('electronAppSettings');

      if (!user) {
        throw new Error('User not found');
      }

      return user.electronAppSettings || { calendarZoomLevel: 60 };
    }),
});
