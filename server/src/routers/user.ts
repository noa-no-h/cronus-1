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

  updateUserGoals: publicProcedure
    .input(
      z.object({
        token: z.string(),
        weeklyGoal: z.string().optional(),
        dailyGoal: z.string().optional(),
        lifeGoal: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const decoded = verifyToken(input.token);
      const userId = decoded.userId;

      const updateData: any = {};
      if (input.weeklyGoal !== undefined) {
        updateData['userGoals.weeklyGoal'] = input.weeklyGoal;
      }
      if (input.dailyGoal !== undefined) {
        updateData['userGoals.dailyGoal'] = input.dailyGoal;
      }
      if (input.lifeGoal !== undefined) {
        updateData['userGoals.lifeGoal'] = input.lifeGoal;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return {
        success: true,
        userGoals: updatedUser.userGoals,
      };
    }),

  getUserGoals: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const decoded = verifyToken(input.token);
    const userId = decoded.userId;

    const user = await User.findById(userId).select('userGoals');

    if (!user) {
      throw new Error('User not found');
    }

    return user.userGoals || { weeklyGoal: '', dailyGoal: '', lifeGoal: '' };
  }),
});
