import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { generateUploadUrl, getPublicUrl } from '../services/s3-v2';
import { publicProcedure, router } from '../trpc'; // Using publicProcedure for now
import { verifyToken } from './auth'; // Import verifyToken

export const s3Router = router({
  getUploadUrl: publicProcedure
    .input(
      z.object({
        fileType: z.string().optional().default('image/jpeg'),
        // Assuming token is passed for user identification until proper auth middleware is in place for protectedProcedure
        // This is NOT secure for production if just anyone can get an upload URL.
        // You MUST secure this endpoint properly based on your auth setup.
        token: z.string(), // Temporary: To get userId. Replace with proper auth context.
      })
    )
    .mutation(async ({ input }: { input: { fileType: string; token: string } }) => {
      let userId: string;
      try {
        if (!input.token) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication token is required.',
          });
        }
        const decodedToken = verifyToken(input.token);
        userId = decodedToken.userId;
      } catch (error) {
        // Assuming verifyToken throws an error with a 'code' property for TRPCError
        if (error instanceof Error && 'code' in error && error.code === 'UNAUTHORIZED') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token.',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication error.',
        });
      }

      if (!userId) {
        // This case should ideally be caught by verifyToken throwing an error
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID could not be determined from token.',
        });
      }

      const { uploadUrl, key } = await generateUploadUrl(userId, input.fileType);
      return { uploadUrl, key, publicUrl: getPublicUrl(key) };
    }),
});
