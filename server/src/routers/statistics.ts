import { startOfToday } from 'date-fns';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
import { UserModel } from '../models/user';
import { publicProcedure, router } from '../trpc';

export const statisticsRouter = router({
  getActiveUserCountToday: publicProcedure.query(async () => {
    const startOfTodayTimestamp = startOfToday().getTime();

    const distinctUsers = await ActiveWindowEventModel.distinct('userId', {
      timestamp: { $gte: startOfTodayTimestamp },
    });

    return {
      count: distinctUsers.length,
    };
  }),
  getActiveUsersToday: publicProcedure.query(async () => {
    const startOfTodayTimestamp = startOfToday().getTime();

    const distinctUserIds = await ActiveWindowEventModel.distinct('userId', {
      timestamp: { $gte: startOfTodayTimestamp },
    });

    const users = await UserModel.find({
      _id: { $in: distinctUserIds },
    }).select('email name');

    return users;
  }),
});
