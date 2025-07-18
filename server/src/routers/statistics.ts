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

  getCumulativeSignupsChart: publicProcedure.query(async () => {
    const thirtyDaysAgo = subDays(startOfDay(new Date()), 30);
    const today = new Date();

    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

    const cumulativeSignupsByDay = await Promise.all(
      days.map(async (day) => {
        const endOfDayTimestamp = startOfDay(subDays(day, -1)).getTime();

        const count = await UserModel.countDocuments({
          createdAt: {
            $lt: new Date(endOfDayTimestamp),
          },
        });

        return {
          date: format(day, 'yyyy-MM-dd'),
          cumulativeSignups: count,
        };
      })
    );

    return cumulativeSignupsByDay;
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
      totalSignups > 0 ? (totalActiveUsers.length / totalSignups) * 100 : 0;

    // For this week, we need a different approach since active users != new signups
    // Option 1: Overall conversion rate
    const overallConversionRate =
      totalSignups > 0 ? (totalActiveUsers.length / totalSignups) * 100 : 0;

    // Option 2: Activity level (how many active users per new signup)
    const activityMultiplier =
      signupsThisWeek > 0 ? activeUsersThisWeek.length / signupsThisWeek : 0;

    // How many of this week's new signups became active users?
    const newSignupUserIds = await UserModel.find({
      createdAt: { $gte: startOfThisWeek, $lte: endOfThisWeek },
    }).distinct('_id');

    const activeNewSignups = await ActiveWindowEventModel.distinct('userId', {
      userId: { $in: newSignupUserIds },
      timestamp: { $gte: startOfThisWeek.getTime(), $lte: endOfThisWeek.getTime() },
    });

    const newUserActivationRate =
      signupsThisWeek > 0 ? (activeNewSignups.length / signupsThisWeek) * 100 : 0;

    // What % of active users this week were new signups?
    const newUserShare =
      activeUsersThisWeek.length > 0
        ? (activeNewSignups.length / activeUsersThisWeek.length) * 100
        : 0;

    // 7-Day User Retention - users who were active last week AND this week
    const startOfLastWeek = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
    const endOfLastWeek = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });

    const activeUsersLastWeek = await ActiveWindowEventModel.distinct('userId', {
      timestamp: {
        $gte: startOfLastWeek.getTime(),
        $lte: endOfLastWeek.getTime(),
      },
    });

    const retainedUsers = await ActiveWindowEventModel.distinct('userId', {
      userId: { $in: activeUsersLastWeek },
      timestamp: {
        $gte: startOfThisWeek.getTime(),
        $lte: endOfThisWeek.getTime(),
      },
    });

    const weeklyRetentionRate =
      activeUsersLastWeek.length > 0
        ? (retainedUsers.length / activeUsersLastWeek.length) * 100
        : 0;

    // WoW Signup Growth
    const signupsLastWeek = await UserModel.countDocuments({
      createdAt: {
        $gte: startOfLastWeek,
        $lte: endOfLastWeek,
      },
    });

    const signupGrowthRate =
      signupsLastWeek > 0 ? ((signupsThisWeek - signupsLastWeek) / signupsLastWeek) * 100 : 0;

    // Average Events per User this week
    const totalEventsThisWeek = await ActiveWindowEventModel.countDocuments({
      timestamp: {
        $gte: startOfThisWeek.getTime(),
        $lte: endOfThisWeek.getTime(),
      },
    });

    const avgEventsPerUser =
      activeUsersThisWeek.length > 0 ? totalEventsThisWeek / activeUsersThisWeek.length : 0;

    return {
      signupsThisWeek,
      activeUsersThisWeek: activeUsersThisWeek.length,
      conversionRate: Math.round(overallConversionRate * 10) / 10, // e.g., "53.2%"
      activityMultiplier: Math.round(activityMultiplier * 10) / 10, // e.g., "1.96x"
      totalSignups,
      totalActiveUsersLastWeek: totalActiveUsers.length,
      newUserActivationRate: Math.round(newUserActivationRate * 10) / 10, // e.g., "75%"
      newUserShare: Math.round(newUserShare * 10) / 10, // e.g., "38%"
      weeklyRetentionRate: Math.round(weeklyRetentionRate * 10) / 10, // e.g., "65.3%"
      signupGrowthRate: Math.round(signupGrowthRate * 10) / 10, // e.g., "12.5%"
      avgEventsPerUser: Math.round(avgEventsPerUser * 10) / 10, // e.g., "42.3"
    };
  }),
});
