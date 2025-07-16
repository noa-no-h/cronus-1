import { startOfDay, startOfToday, startOfYesterday, subDays } from 'date-fns';
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
  getActiveUserCountYesterday: publicProcedure.query(async () => {
    const startOfYesterdayTimestamp = startOfYesterday().getTime();
    const startOfTodayTimestamp = startOfToday().getTime();

    const distinctUsers = await ActiveWindowEventModel.distinct('userId', {
      timestamp: {
        $gte: startOfYesterdayTimestamp,
        $lt: startOfTodayTimestamp,
      },
    });

    return {
      count: distinctUsers.length,
    };
  }),
  getActiveUsersYesterday: publicProcedure.query(async () => {
    const startOfYesterdayTimestamp = startOfYesterday().getTime();
    const startOfTodayTimestamp = startOfToday().getTime();

    const distinctUserIds = await ActiveWindowEventModel.distinct('userId', {
      timestamp: {
        $gte: startOfYesterdayTimestamp,
        $lt: startOfTodayTimestamp,
      },
    });

    const users = await UserModel.find({
      _id: { $in: distinctUserIds },
    }).select('email name');

    return users;
  }),
  getActiveUserCountLastWeek: publicProcedure.query(async () => {
    const sevenDaysAgoTimestamp = subDays(startOfDay(new Date()), 7).getTime();

    const distinctUsers = await ActiveWindowEventModel.distinct('userId', {
      timestamp: { $gte: sevenDaysAgoTimestamp },
    });

    return {
      count: distinctUsers.length,
    };
  }),
  getActiveUsersLastWeek: publicProcedure.query(async () => {
    const sevenDaysAgoTimestamp = subDays(startOfDay(new Date()), 7).getTime();

    const distinctUserIds = await ActiveWindowEventModel.distinct('userId', {
      timestamp: { $gte: sevenDaysAgoTimestamp },
    });

    const users = await UserModel.find({
      _id: { $in: distinctUserIds },
    }).select('email name');

    return users;
  }),
});
