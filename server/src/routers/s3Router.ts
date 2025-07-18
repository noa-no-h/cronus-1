import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { safeVerifyToken } from '../lib/authUtils';
import { generateUploadUrl, getPublicUrl } from '../services/s3-v2';
import { publicProcedure, router } from '../trpc';

export const s3Router = router({
  getUploadUrl: publicProcedure
    .input(
      z.object({
        fileType: z.string().optional().default('image/jpeg'),
        token: z.string(),
      })
    )
    .mutation(async ({ input }: { input: { fileType: string; token: string } }) => {
      if (!input.token) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication token is required.',
        });
      }

      const decodedToken = safeVerifyToken(input.token);
      const userId = decodedToken.userId;

      const { uploadUrl, key } = await generateUploadUrl(userId, input.fileType);
      return { uploadUrl, key, publicUrl: getPublicUrl(key) };
    }),
});
