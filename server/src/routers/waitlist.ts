import { z } from 'zod';
import { WindowsWaitlist } from '../models/windowsWaitlist';
import { publicProcedure, router } from '../trpc';

export const waitlistRouter = router({
  addToWindowsWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const waitlistEntry = new WindowsWaitlist({
          email: input.email,
        });
        await waitlistEntry.save();
        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message.includes('E11000')) {
          return { success: true };
        }
        throw error;
      }
    }),
});
