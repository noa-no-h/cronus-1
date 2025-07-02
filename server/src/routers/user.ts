import { z } from 'zod';
import { User } from '../models/user';
import { publicProcedure, router } from '../trpc';
import { verifyToken } from './auth';

export const userRouter = router({
  updateElectronAppSettings: publicProcedure
    .input(
      z.object({
        token: z.string(),
        calendarZoomLevel: z.number().optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        playDistractionSound: z.boolean().optional(),
        distractionSoundInterval: z.number().min(5).max(300).optional(),
        showDistractionNotifications: z.boolean().optional(),
        distractionNotificationInterval: z.number().min(5).max(300).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const decoded = verifyToken(input.token);
      const userId = decoded.userId;

      const updateData: any = {};
      if (input.calendarZoomLevel !== undefined) {
        updateData['electronAppSettings.calendarZoomLevel'] = input.calendarZoomLevel;
      }
      if (input.theme !== undefined) {
        updateData['electronAppSettings.theme'] = input.theme;
      }
      if (input.playDistractionSound !== undefined) {
        updateData['electronAppSettings.playDistractionSound'] = input.playDistractionSound;
      }
      if (input.distractionSoundInterval !== undefined) {
        updateData['electronAppSettings.distractionSoundInterval'] = input.distractionSoundInterval;
      }
      if (input.showDistractionNotifications !== undefined) {
        updateData['electronAppSettings.showDistractionNotifications'] =
          input.showDistractionNotifications;
      }
      if (input.distractionNotificationInterval !== undefined) {
        updateData['electronAppSettings.distractionNotificationInterval'] =
          input.distractionNotificationInterval;
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

      const user = await User.findById(userId).select('electronAppSettings').lean();

      if (!user) {
        throw new Error('User not found');
      }

      const defaultSettings = {
        calendarZoomLevel: 64,
        theme: 'system',
        playDistractionSound: true,
        distractionSoundInterval: 30,
        showDistractionNotifications: true,
        distractionNotificationInterval: 60,
      };

      return {
        ...defaultSettings,
        ...(user.electronAppSettings || {}),
      };
    }),

  updateUserProjectsAndGoals: publicProcedure
    .input(
      z.object({
        token: z.string(),
        userProjectsAndGoals: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const decoded = verifyToken(input.token);
      const userId = decoded.userId;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { userProjectsAndGoals: input.userProjectsAndGoals } },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return {
        success: true,
        userProjectsAndGoals: updatedUser.userProjectsAndGoals,
      };
    }),

  getUserProjectsAndGoals: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const decoded = verifyToken(input.token);
      const userId = decoded.userId;

      const user = await User.findById(userId).select('userProjectsAndGoals');

      if (!user) {
        throw new Error('User not found');
      }

      return user.userProjectsAndGoals || '';
    }),

  getMultiPurposeApps: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const decoded = verifyToken(input.token);
      const userId = decoded.userId;

      const user = await User.findById(userId).select('multiPurposeApps').lean();

      if (!user) {
        throw new Error('User not found');
      }

      return user.multiPurposeApps || [];
    }),

  updateMultiPurposeApps: publicProcedure
    .input(
      z.object({
        token: z.string(),
        apps: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const decoded = verifyToken(input.token);
      const userId = decoded.userId;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { multiPurposeApps: input.apps } },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return {
        success: true,
        multiPurposeApps: updatedUser.multiPurposeApps,
      };
    }),
});
