import { z } from 'zod';
import { tokenTracker } from '../services/tracking/tokenUsageTracker';
import { router, publicProcedure } from '../trpc';
import { safeVerifyToken } from '../lib/authUtils';

export const tokenUsageRouter = router({
  // Get today's token usage
  getTodayUsage: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const decodedToken = safeVerifyToken(input.token);
        // For now, just checking if the token is valid
        
        // Force flush any pending logs
        tokenTracker.flush();
        
        // Get today's usage
        return {
          success: true,
          data: tokenTracker.getTodayUsage()
        };
      } catch (error) {
        return {
          success: false,
          error: 'Invalid authentication'
        };
      }
    }),
    
  // Get usage for the last N days
  getRecentUsage: publicProcedure
    .input(z.object({ 
      token: z.string(),
      days: z.number().min(1).max(30).default(7) 
    }))
    .query(async ({ input }) => {
      try {
        const decodedToken = safeVerifyToken(input.token);
        // For now, just checking if the token is valid
        
        // Force flush any pending logs
        tokenTracker.flush();
        
        // Get usage for the requested days
        return {
          success: true,
          data: tokenTracker.getRecentUsage(input.days)
        };
      } catch (error) {
        return {
          success: false,
          error: 'Invalid authentication'
        };
      }
    }),

  // Get usage for a specific date
  getUsageByDate: publicProcedure
    .input(z.object({ 
      token: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
    }))
    .query(async ({ input }) => {
      try {
        const decodedToken = safeVerifyToken(input.token);
        // For now, just checking if the token is valid
        
        // Force flush any pending logs
        tokenTracker.flush();
        
        // Get usage for the requested date
        return {
          success: true,
          data: tokenTracker.getUsageByDate(input.date)
        };
      } catch (error) {
        return {
          success: false,
          error: 'Invalid authentication'
        };
      }
    }),
    
  // Get complete token usage statistics
  getTokenUsageStats: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const decodedToken = safeVerifyToken(input.token);
        // For now, just checking if the token is valid
        
        // Force flush any pending logs
        tokenTracker.flush();
        
        // Get complete token usage statistics
        return {
          success: true,
          data: tokenTracker.getTokenUsageStats()
        };
      } catch (error) {
        return {
          success: false,
          error: 'Invalid authentication'
        };
      }
    })
});