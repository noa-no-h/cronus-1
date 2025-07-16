import { startOfToday } from 'date-fns';
import { ActiveWindowEventModel } from '../models/activeWindowEvent';
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
});
