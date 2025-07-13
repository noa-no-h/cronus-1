import { z } from 'zod';
import { TeamsWaitlist } from '../models/teamsWaitlist';
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
  addToTeamsWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        companyName: z.string().min(1),
        teamSize: z.string().min(1),
        additionalInfo: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const waitlistEntry = new TeamsWaitlist({
          email: input.email,
          companyName: input.companyName,
          teamSize: input.teamSize,
          additionalInfo: input.additionalInfo,
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
