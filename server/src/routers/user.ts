import { z } from 'zod';
import { safeVerifyToken } from '../lib/authUtils';
import { isVersionOutdated } from '../lib/versionUtils';
import { UserModel } from '../models/user';
import { publicProcedure, router } from '../trpc';

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
        distractionNotificationInterval: z.number().min(5).max(600).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const decoded = safeVerifyToken(input.token);
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

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      );

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
      const decoded = safeVerifyToken(input.token);
      const userId = decoded.userId;

      const user = await UserModel.findById(userId).select('electronAppSettings').lean();

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
      const decoded = safeVerifyToken(input.token);
      const userId = decoded.userId;

      const updatedUser = await UserModel.findByIdAndUpdate(
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
      const decoded = safeVerifyToken(input.token);
      const userId = decoded.userId;

      const user = await UserModel.findById(userId).select('userProjectsAndGoals');

      if (!user) {
        throw new Error('User not found');
      }

      return user.userProjectsAndGoals || '';
    }),

  getUserGoals: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const decoded = safeVerifyToken(input.token);
    const userId = decoded.userId;

    const user = await UserModel.findById(userId).select('userProjectsAndGoals');
    if (!user) {
      throw new Error('User not found');
    }

    return user.userProjectsAndGoals || '';
  }),

  updateUserGoals: publicProcedure
    .input(
      z.object({
        token: z.string(),
        goals: z.string().optional(),
        userProjectsAndGoals: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const decoded = safeVerifyToken(input.token);
      const userId = decoded.userId;

      const goalsContent = input.goals || input.userProjectsAndGoals;

      if (!goalsContent) {
        throw new Error('Goals content is required');
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { $set: { userProjectsAndGoals: goalsContent } },
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

  getMultiPurposeApps: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const decoded = safeVerifyToken(input.token);
      const userId = decoded.userId;

      const user = await UserModel.findById(userId).select('multiPurposeApps').lean();

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
      const decoded = safeVerifyToken(input.token);
      const userId = decoded.userId;

      const updatedUser = await UserModel.findByIdAndUpdate(
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

  updateUserReferral: publicProcedure
    .input(
      z.object({
        token: z.string(),
        referralSource: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.referralSource.trim()) {
        // Don't update if the input is empty or just whitespace
        return { success: true };
      }

      const decoded = safeVerifyToken(input.token);
      const userId = decoded.userId;

      await UserModel.findByIdAndUpdate(userId, {
        $set: { referralSource: input.referralSource },
      });

      return { success: true };
    }),

  getUserReferralSource: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const decoded = safeVerifyToken(input.token);
      const userId = decoded.userId;

      const user = await UserModel.findById(userId).select('referralSource');

      if (!user) {
        throw new Error('User not found');
      }

      return user.referralSource || '';
    }),

  // Admin endpoint to query users by version
  getUsersByVersion: publicProcedure
    .input(
      z.object({
        token: z.string(),
        minimumVersion: z.string().optional().default('1.7.0'),
        includeNoVersion: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      const decoded = safeVerifyToken(input.token);
      const user = await UserModel.findById(decoded.userId);

      // Simple admin check - only allow specific emails
      const adminEmails = ['wallawitsch@gmail.com', 'arne.strickmann@googlemail.com'];
      if (!user || !adminEmails.includes(user.email)) {
        throw new Error('Access denied: Admin privileges required');
      }

      const query: any = {};

      if (input.includeNoVersion) {
        // Find users with outdated versions OR no version recorded
        query.$or = [
          { clientVersion: { $exists: false } },
          { clientVersion: null },
          { clientVersion: '' },
        ];
      }

      // Add users with versions older than minimum
      const allUsers = await UserModel.find(
        {
          clientVersion: { $exists: true, $ne: null },
          $and: [{ clientVersion: { $ne: '' } }],
        },
        'email name clientVersion clientVersionLastUpdated createdAt'
      ).lean();

      const outdatedUsers = allUsers.filter(
        (u) => u.clientVersion && isVersionOutdated(u.clientVersion, input.minimumVersion)
      );

      // Get users with no version info if requested
      let usersWithoutVersion: any[] = [];
      if (input.includeNoVersion) {
        usersWithoutVersion = await UserModel.find(
          {
            $or: [
              { clientVersion: { $exists: false } },
              { clientVersion: null },
              { clientVersion: '' },
            ],
          },
          'email name createdAt'
        ).lean();
      }

      return {
        outdatedUsers: outdatedUsers.map((u) => ({
          id: u._id.toString(),
          email: u.email,
          name: u.name,
          clientVersion: u.clientVersion,
          lastVersionUpdate: u.clientVersionLastUpdated,
          createdAt: u.createdAt,
        })),
        usersWithoutVersion: usersWithoutVersion.map((u) => ({
          id: u._id.toString(),
          email: u.email,
          name: u.name,
          clientVersion: null,
          createdAt: u.createdAt,
        })),
        summary: {
          totalOutdated: outdatedUsers.length,
          totalWithoutVersion: usersWithoutVersion.length,
          minimumVersion: input.minimumVersion,
        },
      };
    }),

  // Endpoint to get version statistics
  getVersionStats: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const decoded = safeVerifyToken(input.token);
      const user = await UserModel.findById(decoded.userId);

      // Simple admin check
      const adminEmails = ['wallawitsch@gmail.com', 'arne.strickmann@googlemail.com'];
      if (!user || !adminEmails.includes(user.email)) {
        throw new Error('Access denied: Admin privileges required');
      }

      const versionStats = await UserModel.aggregate([
        {
          $group: {
            _id: '$clientVersion',
            count: { $sum: 1 },
            lastSeen: { $max: '$clientVersionLastUpdated' },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      const totalUsers = await UserModel.countDocuments();

      return {
        versionBreakdown: versionStats.map((stat) => ({
          version: stat._id || 'Unknown',
          userCount: stat.count,
          lastSeen: stat.lastSeen,
        })),
        totalUsers,
      };
    }),
});
