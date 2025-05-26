import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { generateUploadUrl, getPublicUrl } from '../services/s3';
import { publicProcedure, router } from '../trpc'; // Using publicProcedure for now

export const s3Router = router({
  getUploadUrl: publicProcedure // Changed to publicProcedure
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
      // TODO: Secure this properly. The following is a placeholder and might not align with your actual auth.
      // This is a simplified way to get userId, assuming your token verification logic is elsewhere
      // and can provide a userId. Ideally, this comes from ctx.user.id with a protectedProcedure.
      let userId = 'temp-user-id'; // Placeholder
      try {
        // Example: const decoded = verifyToken(input.token); userId = decoded.userId;
        // For now, we need a placeholder or a way to extract it. This part is critical for security.
        // Since we don't have the verifyToken function here, we'll throw if token implies a real user is needed
        // but for the sake of generating a URL, we might proceed with a generic path or block.
        // This needs to be replaced with your actual user identification from the token.
        if (!input.token) {
          // Basic check, real validation needed
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication token is required.',
          });
        }
        // Simulate getting userId from token - REPLACE THIS WITH ACTUAL LOGIC
        // userId = getUserIdFromToken(input.token);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication error.',
        });
      }

      if (!userId) {
        // Ensure userId is set after token processing
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID could not be determined from token.',
        });
      }

      const { uploadUrl, key } = await generateUploadUrl(userId, input.fileType);
      return { uploadUrl, key, publicUrl: getPublicUrl(key) };
    }),
});
