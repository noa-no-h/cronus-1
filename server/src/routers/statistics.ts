import {
  startOfDay,
  startOfToday,
  startOfYesterday,
  subDays,
  startOfWeek,
  endOfWeek,
  format,
  eachDayOfInterval,
} from 'date-fns';
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

  // New endpoints for dashboard features
  getSignupsGrowthChart: publicProcedure.query(async () => {
    const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);
    const today = new Date();

    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

    const signupsByDay = await Promise.all(
      days.map(async (day) => {
        const startOfDayTimestamp = startOfDay(day).getTime();
        const endOfDayTimestamp = startOfDay(subDays(day, -1)).getTime();

        const count = await UserModel.countDocuments({
          createdAt: {
            $gte: new Date(startOfDayTimestamp),
            $lt: new Date(endOfDayTimestamp),
          },
        });

        return {
          date: format(day, 'yyyy-MM-dd'),
          signups: count,
        };
      })
    );

    return signupsByDay;
  }),

  getActiveWindowEventsChart: publicProcedure.query(async () => {
    const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);
    const today = new Date();

    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

    const eventsByDay = await Promise.all(
      days.map(async (day) => {
        const startOfDayTimestamp = startOfDay(day).getTime();
        const endOfDayTimestamp = startOfDay(subDays(day, -1)).getTime();

        const count = await ActiveWindowEventModel.countDocuments({
          timestamp: {
            $gte: startOfDayTimestamp,
            $lt: endOfDayTimestamp,
          },
        });

        return {
          date: format(day, 'yyyy-MM-dd'),
          events: count,
        };
      })
    );

    return eventsByDay;
  }),

  getKPIs: publicProcedure.query(async () => {
    const now = new Date();
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });

    // Total signups this week
    const signupsThisWeek = await UserModel.countDocuments({
      createdAt: {
        $gte: startOfThisWeek,
        $lte: endOfThisWeek,
      },
    });

    // Active users this week
    const activeUsersThisWeek = await ActiveWindowEventModel.distinct('userId', {
      timestamp: {
        $gte: startOfThisWeek.getTime(),
        $lte: endOfThisWeek.getTime(),
      },
    });

    // All-time signups to active users ratio
    const totalSignups = await UserModel.countDocuments({});
    const sevenDaysAgoTimestamp = subDays(startOfDay(new Date()), 7).getTime();
    const totalActiveUsers = await ActiveWindowEventModel.distinct('userId', {
      timestamp: { $gte: sevenDaysAgoTimestamp },
    });

    const signupsToActiveRatio =
      totalActiveUsers.length > 0 ? totalSignups / totalActiveUsers.length : 0;
    const signupsToActiveRatioThisWeek =
      activeUsersThisWeek.length > 0 ? signupsThisWeek / activeUsersThisWeek.length : 0;

    return {
      signupsThisWeek,
      activeUsersThisWeek: activeUsersThisWeek.length,
      signupsToActiveRatio: Math.round(signupsToActiveRatio * 100) / 100,
      signupsToActiveRatioThisWeek: Math.round(signupsToActiveRatioThisWeek * 100) / 100,
      totalSignups,
      totalActiveUsersLastWeek: totalActiveUsers.length,
    };
  }),
});
